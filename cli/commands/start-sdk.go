package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
)

type ArgParams struct {
	LogLevel                   string `json:"logLevel"`
	ExcludeServer              bool   `json:"excludeServer"`              // fase
	ListenAddr                 string `json:"listenAddr"`                 // 默认9991端口 ,可命令行更改
	MiddlewareListenPort       string `json:"middlewareListenPort"`       // 默认9991端口 ,可命令行更改
	EnableDebugMode            bool   `json:"enableDebugMode"`            // debug开关,命令行获取，默认关
	DisableForceHttpsRedirects bool   `json:"disableForceHttpsRedirects"` //  https强制跳转,命令行获取,默认开
	EnableIntrospection        bool   `json:"enableIntrospection"`        //  内省开关,命令行获取,默认不开启,
}

const (
	wundergraphDir1           = "wundergraph/.wundergraph"
	configEntryPointFilename1 = "wundergraph.server.ts"
	serverEntryPointFilename1 = "wundergraph.config.ts"
	configJsonFilename1       = "wundergraph.config.json"
)

func initArg(argConfig []byte) (err error) {
	enableDebugMode = true
	argsInit := ArgParams{}
	//err := json.Unmarshal(argConfig, &vss)
	err = json.Unmarshal(argConfig, &argsInit)
	if err != nil {
		return
	}

	enableDebugMode = argsInit.EnableDebugMode
	logLevel = argsInit.LogLevel
	excludeServer = argsInit.ExcludeServer
	listenAddr = argsInit.ListenAddr
	middlewareListenPort, err = strconv.Atoi(argsInit.MiddlewareListenPort)
	if err != nil {
		middlewareListenPort = 9992
	}
	enableDebugMode = argsInit.EnableDebugMode
	disableForceHttpsRedirects = argsInit.DisableForceHttpsRedirects
	enableIntrospection = argsInit.EnableIntrospection
	if enableDebugMode {
		log = buildLogger(abstractlogger.DebugLevel)
	} else {
		log = buildLogger(findLogLevel(abstractlogger.ErrorLevel))
	}
	return
}

func (c *_c) WdgStart(parentCtx context.Context, argConfig []byte) error {
	// 初始化日志
	err := initArg(argConfig)
	if err != nil {
		return err
	}
	entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir1, configEntryPointFilename1, serverEntryPointFilename1)
	if err != nil {
		return fmt.Errorf("could not find file or directory: %s", err)
	}

	configFile := filepath.ToSlash(path.Join(entryPoints.WunderGraphDirAbs, "generated", configJsonFilename1))
	if !files.FileExists(configFile) {
		return fmt.Errorf("could not find configuration file: %s", configFile)
	}

	ctx, cancel := context.WithCancel(parentCtx)
	defer cancel()

	quit := make(chan os.Signal, 2)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	secret, err := apihandler.GenSymmetricKey(64)
	if err != nil {
		return err
	}

	hooksJWT, err := apihandler.CreateHooksJWT(secret)
	if err != nil {
		return err
	}

	if !excludeServer {
		serverScriptFile := filepath.ToSlash(path.Join("generated", "bundle", "server.js"))
		serverExecutablePath := filepath.ToSlash(path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js"))
		if !files.FileExists(serverExecutablePath) {
			return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wundergraphDir, serverScriptFile))
		}

		hooksEnv := []string{
			"START_HOOKS_SERVER=true",
			fmt.Sprintf("WG_ABS_DIR=%s", entryPoints.WunderGraphDirAbs),
			fmt.Sprintf("HOOKS_TOKEN=%s", hooksJWT),
			fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
			fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
		}

		enableDebugMode = true
		if enableDebugMode {
			hooksEnv = append(hooksEnv, "LOG_LEVEL=debug")
		}

		hookServerRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "hooks-server-runner",
			Executable:    "node",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			ScriptArgs:    []string{serverScriptFile},
			Logger:        log,
			ScriptEnv:     append(os.Environ(), hooksEnv...),
		})

		defer func() {
			log.Debug("Stopping hooks-server-runner server after WunderNode shutdown")
			err := hookServerRunner.Stop()
			if err != nil {
				log.Error("Stopping runner failed",
					abstractlogger.String("runnerName", "hooks-server-runner"),
					abstractlogger.Error(err),
				)
				killExistingHooksProcess()
			}
		}()

		go func() {
			<-hookServerRunner.Run(ctx)
			log.Error("Hook server excited. Initialize WunderNode shutdown")
			// cancel context when hook server stopped
			cancel()
		}()
	}

	cfg := &wundernodeconfig.Config{
		Server: &wundernodeconfig.ServerConfig{
			ListenAddr: listenAddr,
		},
	}
	enableIntrospection = true
	configFileChangeChan := make(chan struct{})
	n := node.New(ctx, BuildInfo, cfg, log)
	go func() {
		err := n.StartBlocking(
			node.WithConfigFileChange(configFileChangeChan),
			node.WithFileSystemConfig(configFile),
			node.WithHooksSecret(secret),
			node.WithDebugMode(enableDebugMode),
			node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
			node.WithIntrospection(enableIntrospection),
			node.WithGitHubAuthDemo(GitHubAuthDemo),
		)
		if err != nil {
			log.Fatal("startBlocking", abstractlogger.Error(err))
		}
	}()

	// trigger server reload after initial config build
	// because no fs event is fired as build is already done
	configFileChangeChan <- struct{}{}

	select {
	case signal := <-quit:
		log.Info("Received interrupt signal. Initialize WunderNode shutdown ...",
			abstractlogger.String("signal", signal.String()),
		)
	case <-ctx.Done():
		log.Info("Context was canceled. Initialize WunderNode shutdown ....")
		//case <-parentCtx.Done():
		//	log.Info("Context was canceled. Initialize WunderNode shutdown ....")
		//
	}

	gracefulTimeoutDur := time.Duration(gracefulTimeout) * time.Second
	log.Info("Graceful shutdown WunderNode ...", abstractlogger.String("gracefulTimeout", gracefulTimeoutDur.String()))
	ctx, cancel = context.WithTimeout(ctx, gracefulTimeoutDur)
	defer cancel()
	err = n.Shutdown(ctx)
	if err != nil {
		log.Error("Error during WunderNode shutdown", abstractlogger.Error(err))
	}

	log.Info("9991 and 9992 WunderNode shutdown complete")

	return nil
}
