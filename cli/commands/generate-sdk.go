package commands

import (
	"context"
	"fmt"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
	"os"
	"path"
	"sync"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

var ()

type args struct {
	generateAndPublish bool
}

func (c *_c) Generate(parentCtx context.Context, argConfig []byte) error {
	err := initArg(argConfig)
	if err != nil {
		return err
	}
	entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir1, configEntryPointFilename1, serverEntryPointFilename1)
	if err != nil {
		return fmt.Errorf("could not find file or directory: %s", err)
	}

	ctx, cancel := context.WithTimeout(parentCtx, 5*time.Minute)
	defer cancel()

	configOutFile := path.Join("generated", "bundle", "config.js")

	configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
		Name:          "config-runner",
		Executable:    "node",
		ScriptArgs:    []string{configOutFile},
		AbsWorkingDir: entryPoints.WunderGraphDirAbs,
		Logger:        log,
		ScriptEnv:     append(os.Environ(), fmt.Sprintf("WUNDERGRAPH_PUBLISH_API=%t", generateAndPublish)),
	})
	defer func() {
		log.Debug("Stopping config-runner after WunderNode shutdown")
		err := configRunner.Stop()
		if err != nil {
			log.Error("Stopping runner failed",
				abstractlogger.String("runnerName", "config-runner"),
				abstractlogger.Error(err),
			)
		}
	}()

	var onAfterBuild func()

	if entryPoints.ServerEntryPointAbs != "" {
		serverOutFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js")
		webhooksOutDir := path.Join("generated", "bundle", "webhooks")
		webhooksDir := path.Join(entryPoints.WunderGraphDirAbs, webhooks.WebhookDirectoryName)

		var webhooksBundler *bundler.Bundler

		if files.DirectoryExists(webhooksDir) {
			webhookPaths, err := webhooks.GetWebhooks(entryPoints.WunderGraphDirAbs)
			if err != nil {
				return err
			}
			webhooksBundler = bundler.NewBundler(bundler.Config{
				Name:          "webhooks-bundler",
				EntryPoints:   webhookPaths,
				AbsWorkingDir: entryPoints.WunderGraphDirAbs,
				OutDir:        webhooksOutDir,
				Logger:        log,
				OnAfterBundle: func() {
					log.Debug("Webhooks bundled!", abstractlogger.String("bundlerName", "webhooks-bundler"))
				},
			})
		}

		hooksBundler := bundler.NewBundler(bundler.Config{
			Name:          "server-bundler",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			EntryPoints:   []string{serverEntryPointFilename},
			OutFile:       serverOutFile,
			Logger:        log,
			WatchPaths:    []string{},
		})

		onAfterBuild = func() {
			<-configRunner.Run(ctx)
			var wg sync.WaitGroup

			wg.Add(1)
			go func() {
				defer wg.Done()
				// bundle hooks
				hooksBundler.Bundle()
			}()

			if webhooksBundler != nil {
				wg.Add(1)
				go func() {
					defer wg.Done()
					webhooksBundler.Bundle()
				}()
			}

			wg.Wait()
			log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))
		}
	} else {
		_, _ = white.Printf("Hooks EntryPoint not found, skipping. File: %s\n", serverEntryPointFilename)
		onAfterBuild = func() {
			<-configRunner.Run(ctx)
			log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))
		}
	}

	configBundler := bundler.NewBundler(bundler.Config{
		Name:          "config-bundler",
		AbsWorkingDir: entryPoints.WunderGraphDirAbs,
		EntryPoints:   []string{configEntryPointFilename},
		OutFile:       configOutFile,
		Logger:        log,
		WatchPaths:    []string{},
		IgnorePaths: []string{
			"generated",
			"node_modules",
		},
		OnAfterBundle: onAfterBuild,
	})

	configBundler.Bundle()

	return nil
}
