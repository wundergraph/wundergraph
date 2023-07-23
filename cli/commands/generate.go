package commands

import (
  "context"
  "fmt"
  "path/filepath"

  "github.com/spf13/cobra"
  "go.uber.org/zap"
  "golang.org/x/sync/errgroup"

  "github.com/wundergraph/wundergraph/cli/helpers"
  "github.com/wundergraph/wundergraph/pkg/bundler"
  "github.com/wundergraph/wundergraph/pkg/files"
  "github.com/wundergraph/wundergraph/pkg/operations"
  "github.com/wundergraph/wundergraph/pkg/scriptrunner"
  "github.com/wundergraph/wundergraph/pkg/telemetry"
  "github.com/wundergraph/wundergraph/pkg/webhooks"
)

var (
  offline bool
)

// generateCmd represents the generate command
var generateCmd = & cobra.Command {
  Use: "generate",
  Short: "Generate the production config",
  Long: `Generate the production config. You need to run this command before you can start the node or hooks server.`,
  Annotations: telemetry.Annotations(telemetry.AnnotationCommand | telemetry.AnnotationDataSources),
  RunE: func(cmd * cobra.Command, args[] string) error {
    wunderGraphDir, err: = files.FindWunderGraphDir(_wunderGraphDirConfig)
    if err != nil {
        return err
      }
      // only validate if the file exists
    _, err = files.CodeFilePath(wunderGraphDir, configEntryPointFilename)
    if err != nil {
      return err
    }

    // optional, no error check
    codeServerFilePath, _: = files.CodeFilePath(wunderGraphDir, serverEntryPointFilename)

    ctx: = context.Background()

    configOutFile: = filepath.Join("generated", "bundle", "config.cjs")

    // XXX: generate never uses the cache
    scriptEnv: = configScriptEnv(configScriptEnvOptions {
        RootFlags: rootFlags,
        WunderGraphDir: wunderGraphDir,
      })
      // Run scripts in prod mode
    scriptEnv = append(scriptEnv, "NODE_ENV=production") << << << < main
    scriptEnv = append(scriptEnv, fmt.Sprintf("WG_ENABLE_INTROSPECTION_OFFLINE=%t", offline))
    scriptEnv = append(scriptEnv, "WG_ALIAS_GRAPHQL_FIELDS=true") // Add this line


    configRunner: = scriptrunner.NewScriptRunner( & scriptrunner.Config {
      Name: "config-runner",
      Executable: "node",
      ScriptArgs: [] string {
        configOutFile
      },
      AbsWorkingDir: wunderGraphDir,
      Logger: log,
      ScriptEnv: scriptEnv, // Pass the scriptEnv variable
      Streaming: true,
    })

    === === =
    scriptEnv = append(scriptEnv, fmt.Sprintf("WG_ENABLE_INTROSPECTION_OFFLINE=%t", offline))

    configRunner: = scriptrunner.NewScriptRunner( & scriptrunner.Config {
      Name: "config-runner",
      Executable: "node",
      ScriptArgs: [] string {
        configOutFile
      },
      AbsWorkingDir: wunderGraphDir,
      Logger: log,
      ScriptEnv: scriptEnv,
      Output: helpers.ScriptRunnerOutputConfig(rootFlags),
    })
    main
    defer func() {
      log.Debug("Stopping config-runner")
      err: = configRunner.Stop()
      if err != nil {
        log.Error("Stopping runner failed",
          zap.String("runnerName", "config-runner"),
          zap.Error(err),
        )
      }
    }()

    var onAfterBuild func(buildErr error, rebuild bool) error
    outExtension: = make(map[string] string)
    outExtension[".js"] = ".cjs"

    if codeServerFilePath != "" {
      serverOutFile: = filepath.Join(wunderGraphDir, "generated", "bundle", "server.cjs")
      ormOutFile: = filepath.Join(wunderGraphDir, "generated", "bundle", "orm.cjs")
      jsonSchemaOutFile: = filepath.Join(wunderGraphDir, "generated", "bundle", "jsonschema.cjs")
      webhooksDir: = filepath.Join(wunderGraphDir, webhooks.WebhookDirectoryName)
      operationsDir: = filepath.Join(wunderGraphDir, operations.DirectoryName)
      generatedBundleOutDir: = filepath.Join("generated", "bundle")

      var webhooksBundler * bundler.Bundler

      if files.DirectoryExists(webhooksDir) {
        webhookPaths, err: = webhooks.GetWebhooks(wunderGraphDir)
        if err != nil {
          return err
        }
        webhooksBundler = bundler.NewBundler(bundler.Config {
          Name: "webhooks-bundler",
          Production: true,
          EntryPoints: webhookPaths,
          AbsWorkingDir: wunderGraphDir,
          OutDir: generatedBundleOutDir,
          OutExtension: outExtension,
          Logger: log,
          OnAfterBundle: func(buildErr error, rebuild bool) error {
            log.Debug("Webhooks bundled!", zap.String("bundlerName", "webhooks-bundler"), zap.Bool("rebuild", rebuild))
            return nil
          },
        })
      }

      ormEntryPointFilename: = filepath.Join(wunderGraphDir, "generated", "orm", "index.ts")
      ormBundler: = bundler.NewBundler(bundler.Config {
        Name: "orm-bundler",
        Production: true,
        AbsWorkingDir: wunderGraphDir,
        EntryPoints: [] string {
          ormEntryPointFilename
        },
        OutFile: ormOutFile,
        Logger: log,
      })

        jsonSchemaEntryPointFilename: = filepath.Join(wunderGraphDir, "generated", "jsonschema.ts")
      jsonSchemaBundler: = bundler.NewBundler(bundler.Config {
        Name: "jsonschema-bundler",
        Production: true,
        AbsWorkingDir: wunderGraphDir,
        EntryPoints: [] string {
          jsonSchemaEntryPointFilename
        },
        OutFile: jsonSchemaOutFile,
        Logger: log,
      })

        hooksBundler: = bundler.NewBundler(bundler.Config {
        Name: "server-bundler",
        Production: true,
        AbsWorkingDir: wunderGraphDir,
        EntryPoints: [] string {
          serverEntryPointFilename
        },
        OutFile: serverOutFile,
        Logger: log,
      })

        onAfterBuild = func(buildErr error, rebuild bool) error {

        if files.DirectoryExists(operationsDir) {
          operationsPaths, err: = operations.GetPaths(wunderGraphDir)
          if err != nil {
            return err
          }
          err = operations.Cleanup(wunderGraphDir, operationsPaths)
          if err != nil {
            return err
          }
          err = operations.EnsureWunderGraphFactoryTS(wunderGraphDir)
          if err != nil {
            return err
          }
          operationsBundler: = bundler.NewBundler(bundler.Config {
            Name: "operations-bundler",
            EntryPoints: operationsPaths,
            AbsWorkingDir: wunderGraphDir,
            OutDir: generatedBundleOutDir,
            OutExtension: outExtension,
            Logger: log,
          })
          err = operationsBundler.Bundle()
          if err != nil {
            return err
          }
        }

        < -configRunner.Run(ctx)

        if !configRunner.Successful() {
          return fmt.Errorf("configuration could not be generated. Process exit with code %d",
            configRunner.ExitCode(),
          )
        }

        var wg errgroup.Group

        wg.Go(func() error {
          // bundle (the generated) orm
          return ormBundler.Bundle()
        })

        wg.Go(func() error {
          // bundle jsonschema
          return jsonSchemaBundler.Bundle()
        })

        wg.Go(func() error {
          // bundle hooks
          return hooksBundler.Bundle()
        })

        if webhooksBundler != nil {
          wg.Go(func() error {
            // bundle webhooks
            return webhooksBundler.Bundle()
          })
        }

        err: = wg.Wait()
        log.Debug("Config built!", zap.String("bundlerName", "config-bundler"))

        return err
      }

    } else {
      log.Debug("wundergraph.server.ts not found, skipping server", zap.String("file", serverEntryPointFilename))
      onAfterBuild = func(buildErr error, rebuild bool) error { < -configRunner.Run(ctx)

        if !configRunner.Successful() {
          return fmt.Errorf("configuration could not be generated. Process exit with code %d",
            configRunner.ExitCode(),
          )
        }

        log.Debug("Config built!", zap.String("bundlerName", "config-bundler"), zap.Bool("rebuild", rebuild))

        return nil
      }
    }

    configBundler: = bundler.NewBundler(bundler.Config {
      Name: "config-bundler",
      Production: true,
      AbsWorkingDir: wunderGraphDir,
      EntryPoints: [] string {
        configEntryPointFilename
      },
      OutFile: configOutFile,
      Logger: log,
      IgnorePaths: [] string {
        "generated",
        "node_modules",
      },
      OnAfterBundle: onAfterBuild,
    })

    // Enable camelCase aliasing for generated GraphQL fields
    configBundler.EnableCamelCaseAlias(true)

    err = configBundler.Bundle()

    return err

  },
}

func init() {
  generateCmd.Flags().BoolVar( & offline, "offline", false, "Disables loading resources from the network")
  rootCmd.AddCommand(generateCmd)
}