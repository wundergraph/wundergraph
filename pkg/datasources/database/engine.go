package database

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"time"

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

func (e *Engine) IntrospectPrismaDatabaseSchema(ctx context.Context, introspectionSchema string) (string, error) {

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

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	cmd := exec.CommandContext(ctx, e.introspectionEnginePath)
	out, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return "", err
	}
	defer stdin.Close()

	err = cmd.Start()
	if err != nil {
		return "", err
	}

	_, err = stdin.Write(cmdInput)
	if err != nil {
		return "", err
	}

	reader := bufio.NewReader(out)
	buf := bytes.Buffer{}

Loop:
	for {
		select {
		case <-ctx.Done():
			return "", fmt.Errorf("timeout waiting for introspection response")
		default:
			b, err := reader.ReadByte()
			if err != nil {
				return "", err
			}
			if b == '\n' {
				break Loop
			}
			err = buf.WriteByte(b)
			if err != nil {
				return "", err
			}
		}
	}

	var response IntrospectionResponse
	err = json.NewDecoder(&buf).Decode(&response)
	if err != nil {
		return "", err
	}
	if response.Error != nil {
		if response.Error.Data.Message != "" {
			// This message is not helpful at all, just omit it
			if response.Error.Message == "An error happened. Check the data field for details." {
				return "", fmt.Errorf("error while introspecting database: %s", response.Error.Data.Message)

			}
			return "", fmt.Errorf("error while introspecting database: %s (%s)", response.Error.Message, response.Error.Data.Message)
		}
		return "", fmt.Errorf("error while introspecting database: %s", response.Error.Message)
	}
	return response.Result.DataModel, nil
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
		if res.Body != nil {
			defer res.Body.Close()
			body, err := io.ReadAll(res.Body)
			if err == nil {
				return fmt.Errorf("http status != 200: %s", string(body))
			}
		}
		return fmt.Errorf("http status != 200")
	}
	_, err = io.Copy(rw, res.Body)
	return
}

func (e *Engine) StartQueryEngine(schema string) (schemaFile string, err error) {

	err = e.ensurePrisma()
	if err != nil {
		return "", err
	}

	freePort, err := freeport.GetFreePort()
	if err != nil {
		return "", err
	}
	port := strconv.Itoa(freePort)
	ctx, cancel := context.WithCancel(context.Background())
	e.cancel = cancel
	e.cmd = exec.CommandContext(ctx, e.queryEnginePath, "-p", port, "--enable-raw-queries")
	// ensure that prisma starts with the dir set to the .wundergraph directory
	// this is important for sqlite support as it's expected that the path of the sqlite file is the same
	// (relative to the .wundergraph directory) during introspection and at runtime
	e.cmd.Dir = e.wundergraphDir

	// append all environment variables, as demonstrated in the following:
	// https://github.com/prisma/prisma/blob/304c54c732921c88bfb57f5730c7f81405ca83ea/packages/engine-core/src/binary/BinaryEngine.ts#L479
	e.cmd.Env = append(e.cmd.Env, os.Environ()...)

	//create temporary file
	temporaryFile, err := ioutil.TempFile("", "t*.prisma")
	if err != nil {
		return "", err
	}

	// calculate the ARG_MAX limit, minus a safety buffer
	const safetyBuffer = 2048
	argMax := 1048576 - safetyBuffer // or however you get the value of ARG_MAX

	if len(schema) < argMax {
		e.cmd.Env = append(e.cmd.Env, "PRISMA_DML="+schema)
		e.log.Info("Schema size found in range.")
	} else {
		// schema is too big, write it to a temp file
		if _, err := temporaryFile.Write([]byte(schema)); err != nil { // ignore the error, we're already handling an error
			return temporaryFile.Name(), err
		}

		e.cmd.Env = append(e.cmd.Env, "PRISMA_DML_PATH="+temporaryFile.Name())
	}

	e.cmd.Stdout = os.Stdout
	e.cmd.Stderr = os.Stderr
	e.url = "http://localhost:" + port
	if err := e.cmd.Start(); err != nil {
		e.StopQueryEngine()
		return temporaryFile.Name(), err
	}
	return temporaryFile.Name(), nil
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

	e.queryEnginePath = filepath.Join(prismaPath, binaries.EngineVersion, fmt.Sprintf("prisma-query-engine-%s", platform.BinaryPlatformName()))
	e.introspectionEnginePath = filepath.Join(prismaPath, binaries.EngineVersion, fmt.Sprintf("prisma-introspection-engine-%s", platform.BinaryPlatformName()))

	if runtime.GOOS == "windows" {
		// Append .exe suffix
		e.queryEnginePath += ".exe"
		e.introspectionEnginePath += ".exe"
	}

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
