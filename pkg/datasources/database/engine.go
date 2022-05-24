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
	"strconv"
	"strings"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/phayes/freeport"
	"github.com/prisma/prisma-client-go/binaries"
	"github.com/prisma/prisma-client-go/binaries/platform"
	"github.com/wundergraph/graphql-go-tools/pkg/repair"
)

func InstallPrismaDependencies(log abstractlogger.Logger) error {
	engine := Engine{
		log: log,
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
	queryEnginePath         string
	introspectionEnginePath string
	url                     string
	cancel                  func()
	client                  *http.Client
	log                     abstractlogger.Logger
}

func NewEngine(client *http.Client, log abstractlogger.Logger) *Engine {
	return &Engine{
		client: client,
		log:    log,
	}
}

func (e *Engine) IntrospectPrismaDatabaseSchema(introspectionSchema string) (string, error) {
	err := e.ensurePrisma()
	if err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	cmd := exec.CommandContext(ctx, e.introspectionEnginePath)

	out := &bytes.Buffer{}
	cmd.Stdout = out
	cmd.Stderr = out

	pipe, err := cmd.StdinPipe()
	if err != nil {
		return "", err
	}

	request := IntrospectionRequest{
		ID:      1,
		Method:  "introspect",
		JSONRPC: "2.0",
		Params: []map[string]interface{}{
			{
				"schema": introspectionSchema,
				"force":  true,
			},
		},
	}
	data, err := json.Marshal(request)
	if err != nil {
		return "", err
	}
	_, err = pipe.Write(append(data, []byte("\n")...))
	if err != nil {
		return "", err
	}

	err = cmd.Start()
	if err != nil {
		return "", err
	}

	var response IntrospectionResponse

	for {
		time.Sleep(time.Millisecond * 100)
		content := out.Bytes()
		if len(content) != 0 {
			err = json.Unmarshal(content, &response)
			if err != nil {
				continue
			}
			break
		}
		if ctx.Err() != nil {
			break
		}
	}

	if response.Error != nil {
		return "", errors.New(response.Error.Data.Message)
	}
	dataModel := strings.Replace(response.Result.DataModel, " Bytes", " String", -1)
	return dataModel, nil
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
	cmd := exec.CommandContext(ctx, e.queryEnginePath, "-p", port)
	cmd.Env = append(cmd.Env, "PRISMA_DML="+schema)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	e.url = "http://localhost:" + port
	go func() {
		_ = cmd.Start()
	}()
	return nil
}

func (e *Engine) ensurePrisma() error {

	prismaPath := path.Join("generated", "prisma")

	err := os.MkdirAll(prismaPath, os.ModePerm)
	if err != nil {
		return err
	}

	e.queryEnginePath = path.Join(prismaPath, binaries.EngineVersion, fmt.Sprintf("prisma-query-engine-%s", platform.BinaryPlatformName()))
	e.introspectionEnginePath = path.Join(prismaPath, binaries.EngineVersion, fmt.Sprintf("prisma-introspection-engine-%s", platform.BinaryPlatformName()))

	_, err = os.Lstat(e.queryEnginePath)
	if os.IsNotExist(err) {
		e.log.Info("downloading prisma query engine",
			abstractlogger.String("path", e.queryEnginePath),
		)
		if err := binaries.FetchEngine(prismaPath, "query-engine", platform.BinaryPlatformName()); err != nil {
			return err
		}
		e.log.Info("downloading prisma query engine complete")
		err = nil
	}

	_, err = os.Lstat(e.introspectionEnginePath)
	if os.IsNotExist(err) {
		e.log.Info("downloading prisma introspection engine",
			abstractlogger.String("path", e.introspectionEnginePath),
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
}
