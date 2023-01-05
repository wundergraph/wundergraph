package database

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-cmd/cmd"
	"github.com/gofrs/flock"
	"github.com/phayes/freeport"
	"github.com/prisma/prisma-client-go/binaries"
	"github.com/prisma/prisma-client-go/binaries/platform"
	"go.uber.org/zap"

	"github.com/wundergraph/graphql-go-tools/pkg/repair"

	"github.com/wundergraph/wundergraph/cli/helpers"
)

func InstallPrismaDependencies(log *zap.Logger, wundergraphDir string) error {
	engine := Engine{
		log:            log,
		wundergraphDir: wundergraphDir,
		client: &http.Client{
			Timeout: time.Second * 10,
		},
	}
	return engine.ensurePrisma()
}

type IntrospectionRequest struct {
	ID      int         `json:"id"`
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
}

type IntrospectionResponse struct {
	ID      int    `json:"id"`
	JSONRPC string `json:"jsonrpc"`
	Result  struct {
		DataModel string `json:"datamodel"`
	} `json:"result"`
	Error *struct {
		Code    int64  `json:"code"`
		Message string `json:"message"`
		Data    struct {
			Message string `json:"message"`
		} `json:"data"`
	} `json:"error"`
}

type Engine struct {
	wundergraphDir          string
	queryEnginePath         string
	introspectionEnginePath string
	url                     string
	cmd                     *exec.Cmd
	cancel                  func()
	client                  *http.Client
	log                     *zap.Logger
}

func NewEngine(client *http.Client, log *zap.Logger, wundergraphDir string) *Engine {
	return &Engine{
		wundergraphDir: wundergraphDir,
		client:         client,
		log:            log,
	}
}

func (e *Engine) IntrospectPrismaDatabaseSchema(introspectionSchema string) (string, error) {
	const (
		cmdTimeout = 10 * time.Second
	)

	var (
		prismaExitedError = errors.New("prisma exited too early")
	)

	err := e.ensurePrisma()
	if err != nil {
		return "", err
	}

	request := IntrospectionRequest{
		ID:      1,
		Method:  "introspect",
		JSONRPC: "2.0",
		Params: []map[string]interface{}{
			{
				"schema":             introspectionSchema,
				"compositeTypeDepth": -1,
			},
		},
	}
	requestData, err := json.Marshal(request)
	if err != nil {
		return "", err
	}
	cmdInput := append(requestData, []byte("\n")...)
	c := cmd.NewCmdOptions(cmd.Options{
		Buffered:  false,
		Streaming: true,
	}, e.introspectionEnginePath)

	ctx, cancel := context.WithTimeout(context.Background(), cmdTimeout)
	defer cancel()

	statusCh := c.StartWithStdin(bytes.NewReader(cmdInput))
	defer c.Stop()

	var responseData bytes.Buffer
	for {
		select {
		case <-ctx.Done():

			return "", fmt.Errorf("prisma query cancelled: %w", ctx.Err())
		case status := <-statusCh:
			return "", fmt.Errorf("prisma exited with status %d", status.Exit)
		case line, open := <-c.Stdout:
			if !open {
				return "", prismaExitedError
			}
			_, _ = io.WriteString(&responseData, line)
			var response IntrospectionResponse
			if err := json.Unmarshal(responseData.Bytes(), &response); err == nil {
				// If error is non-nil, assume JSON is not complete and
				// continue looping. If we don't finish, the timeout will
				// end up killing us.
				if response.Error != nil {
					return "", errors.New(response.Error.Data.Message)
				}
				dataModel := strings.Replace(response.Result.DataModel, " Bytes", " String", -1)
				return dataModel, nil
			}
		case line, open := <-c.Stderr:
			if !open {
				return "", prismaExitedError
			}
			return "", fmt.Errorf("prisma reported an error: %s", line)
		}
	}
}

func (e *Engine) IntrospectGraphQLSchema(ctx context.Context) (schema string, err error) {
	err = e.ensurePrisma()
	if err != nil {
		return "", err
	}
	for {
		select {
		case <-ctx.Done():
			return "", fmt.Errorf("context cancelled")
		default:
			res, err := e.client.Get(e.url + "/sdl")
			if err != nil {
				continue
			}
			if res.StatusCode != http.StatusOK {
				continue
			}
			data, err := ioutil.ReadAll(res.Body)
			if err != nil {
				return "", err
			}
			sdl := string(data)
			sdl = "schema { query: Query mutation: Mutation }\n" + sdl
			schema, err = repair.SDL(sdl, repair.OptionsSDL{
				SetAllMutationFieldsNullable: true,
			})
			return schema, err
		}
	}
}

func (e *Engine) IntrospectDMMF(ctx context.Context) (dmmf string, err error) {
	err = e.ensurePrisma()
	if err != nil {
		return "", err
	}
	for {
		select {
		case <-ctx.Done():
			return "", fmt.Errorf("context cancelled")
		default:
			res, err := e.client.Get(e.url + "/dmmf")
			if err != nil {
				continue
			}
			if res.StatusCode != http.StatusOK {
				continue
			}
			data, err := ioutil.ReadAll(res.Body)
			if err != nil {
				return "", err
			}
			return string(data), err
		}
	}
}

func (e *Engine) Request(ctx context.Context, request []byte, rw io.Writer) (err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, e.url+"/", bytes.NewReader(request))
	if err != nil {
		return err
	}
	req.Header.Set("content-type", "application/json")
	res, err := e.client.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("http status != 200")
	}
	_, err = io.Copy(rw, res.Body)
	return
}

func (e *Engine) StartQueryEngine(schema string) error {

	err := e.ensurePrisma()
	if err != nil {
		return err
	}

	freePort, err := freeport.GetFreePort()
	if err != nil {
		return err
	}
	port := strconv.Itoa(freePort)
	ctx, cancel := context.WithCancel(context.Background())
	e.cancel = cancel
	e.cmd = exec.CommandContext(ctx, e.queryEnginePath, "-p", port)
	// ensure that prisma starts with the dir set to the .wundergraph directory
	// this is important for sqlite support as it's expected that the path of the sqlite file is the same
	// (relative to the .wundergraph directory) during introspection and at runtime
	e.cmd.Dir = e.wundergraphDir
	e.cmd.Env = append(e.cmd.Env, "PRISMA_DML="+schema)
	e.cmd.Stdout = os.Stdout
	e.cmd.Stderr = os.Stderr
	e.url = "http://localhost:" + port
	if err := e.cmd.Start(); err != nil {
		e.StopQueryEngine()
		return err
	}
	return nil
}

func (e *Engine) ensurePrisma() error {

	cacheDir, err := helpers.GlobalWunderGraphCacheDir()
	if err != nil {
		return fmt.Errorf("retrieving cache dir: %w", err)
	}

	prismaPath := filepath.Join(cacheDir, "prisma")

	if err := os.MkdirAll(prismaPath, os.ModePerm); err != nil {
		return err
	}

	e.queryEnginePath = path.Join(prismaPath, binaries.EngineVersion, fmt.Sprintf("prisma-query-engine-%s", platform.BinaryPlatformName()))
	e.introspectionEnginePath = path.Join(prismaPath, binaries.EngineVersion, fmt.Sprintf("prisma-introspection-engine-%s", platform.BinaryPlatformName()))

	// Acquire a file lock before trying to download
	lockPath := filepath.Join(prismaPath, ".lock")
	lock := flock.New(lockPath)

	if err := lock.Lock(); err != nil {
		return fmt.Errorf("creating prisma lockfile: %w", err)
	}
	defer lock.Unlock()

	_, err = os.Lstat(e.queryEnginePath)
	if os.IsNotExist(err) {
		e.log.Info("downloading prisma query engine",
			zap.String("path", e.queryEnginePath),
		)
		if err := binaries.FetchEngine(prismaPath, "query-engine", platform.BinaryPlatformName()); err != nil {
			return err
		}
		e.log.Info("downloading prisma query engine complete")
	}

	_, err = os.Lstat(e.introspectionEnginePath)
	if os.IsNotExist(err) {
		e.log.Info("downloading prisma introspection engine",
			zap.String("path", e.introspectionEnginePath),
		)
		if err := binaries.FetchEngine(prismaPath, "introspection-engine", platform.BinaryPlatformName()); err != nil {
			return err
		}
		e.log.Info("downloading prisma introspection engine complete")
		err = nil
	}

	_ = os.Remove(e.queryEnginePath + ".tmp")
	_ = os.Remove(e.introspectionEnginePath + ".tmp")

	return err
}

func (e *Engine) StopQueryEngine() {
	if e == nil || e.cancel == nil {
		return
	}
	e.cancel()
	exitCh := make(chan error)
	go func() {
		exitCh <- e.cmd.Wait()
	}()
	const prismaExitTimeout = 5 * time.Second
	select {
	case <-exitCh:
		// Ignore errors here, since killing the process with a signal
		// will cause Wait() to return an error and there's no cross-platform
		// way to tell it apart from an interesting failure
	case <-time.After(prismaExitTimeout):
		e.log.Warn(fmt.Sprintf("prisma didn't exit after %s, killing", prismaExitTimeout))
		if err := e.cmd.Process.Kill(); err != nil {
			e.log.Error("killing prisma", zap.Error(err))
		}
	}
	close(exitCh)
	e.cmd = nil
	e.cancel = nil
}

func (e *Engine) WaitUntilReady(ctx context.Context) error {
	done := ctx.Done()
	for {
		select {
		case <-done:
			return fmt.Errorf("WaitUntilReady: context cancelled")
		default:
			_, err := http.Get(e.url)
			if err != nil {
				time.Sleep(time.Millisecond * 10)
				continue
			}
			return nil
		}
	}
}
