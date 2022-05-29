package bundleconfig

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/fsnotify/fsnotify"
	"github.com/jensneuse/abstractlogger"
)

const watchFileLimit = 1000

// NonNodeModuleReg copied from https://github.com/egoist/tsup/blob/dev/src/esbuild/external.ts#L5
var NonNodeModuleReg = regexp.MustCompile(`^[^./]|^\.[^./]|^\.\.[^/]`) // Must not start with "/" or "./" or "../"

type Bundler struct {
	name                        string
	entryPoint                  string
	watchPaths                  []string
	ignorePaths                 []string
	outFile                     string
	log                         abstractlogger.Logger
	scriptEnv                   []string
	cmd                         *exec.Cmd
	stopFileWatchChan           chan struct{}
	stopCmdChan                 chan struct{}
	onFirstRun                  chan struct{}
	stopped                     bool
	cancel                      func()
	externalImports             []string
	fileLoaders                 []string
	skipBuild                   bool
	skipRun                     bool
	skipWatch                   bool
	skipWatchOnEntryPoint       bool
	enableProcessEnvUsagePlugin bool
	blockOnBuild                bool
	mu                          sync.Mutex
}

type Config struct {
	EntryPoint            string
	WatchPaths            []string
	IgnorePaths           []string
	ScriptEnv             []string
	OutFile               string
	SkipBuild             bool
	SkipRun               bool
	SkipWatch             bool
	BlockOnBuild          bool
	SkipWatchOnEntryPoint bool
	// OnFirstRun is closed after the initial build and script run
	OnFirstRun                  chan struct{}
	EnableProcessEnvUsagePlugin bool
}

func NewBundler(name string, config Config, log abstractlogger.Logger) (*Bundler, error) {
	return &Bundler{
		name:                        name,
		entryPoint:                  config.EntryPoint,
		watchPaths:                  config.WatchPaths,
		ignorePaths:                 config.IgnorePaths,
		scriptEnv:                   config.ScriptEnv,
		outFile:                     config.OutFile,
		log:                         log,
		stopFileWatchChan:           make(chan struct{}),
		stopCmdChan:                 make(chan struct{}),
		onFirstRun:                  config.OnFirstRun,
		fileLoaders:                 []string{".graphql", ".gql", ".graphqls", ".yml", ".yaml"},
		skipBuild:                   config.SkipBuild,
		skipWatch:                   config.SkipWatch,
		blockOnBuild:                config.BlockOnBuild,
		skipWatchOnEntryPoint:       config.SkipWatchOnEntryPoint,
		enableProcessEnvUsagePlugin: config.EnableProcessEnvUsagePlugin,
	}, nil
}

func (b *Bundler) Stop(ctx context.Context) {
	if b.stopped {
		return
	}

	if b.cancel != nil {
		b.cancel()
		b.stopped = true
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-b.stopCmdChan:
			return
		}
	}
}

func (b *Bundler) Run() {
	if b.skipBuild {
		if !b.skipRun {
			b.run(b.blockOnBuild)
		}
		return
	}
	b.bundle()
}

func (b *Bundler) bundle() {
	result := b.initialBuild()
	if len(result.Errors) != 0 {
		retry := b.fixErrorsAndRetry(result)
		if retry {
			b.Run()
			return
		}
		b.log.Fatal("Config Bundler: initial build failed",
			abstractlogger.String("bundler", b.name),
			abstractlogger.String("outFile", b.outFile),
			abstractlogger.Any("errors", result.Errors),
		)
	} else {
		b.log.Debug("Config Bundler: initial build successful")
	}
	b.log.Debug("Config Bundler: watching for file changes",
		abstractlogger.String("bundler", b.name),
		abstractlogger.String("outFile", b.outFile),
		abstractlogger.Strings("externalImports", b.externalImports),
		abstractlogger.Strings("fileLoaders", b.fileLoaders),
	)

	b.run(b.blockOnBuild)

	if b.onFirstRun != nil {
		close(b.onFirstRun)
	}

	b.watch(result.Rebuild)
}

const (
	importPrefix = "Could not resolve \""
	importSuffix = "\" (mark it as external to exclude it from the bundle)"
	loaderPrefix = "No loader is configured for \""
)

func (b *Bundler) fixErrorsAndRetry(result api.BuildResult) bool {
	retry := false
WithNextError:
	for _, message := range result.Errors {
		if strings.HasPrefix(message.Text, importPrefix) && strings.HasSuffix(message.Text, importSuffix) {
			externalImport := strings.TrimSuffix(strings.TrimPrefix(message.Text, importPrefix), importSuffix)
			b.log.Debug("Bundler: configuring import as external",
				abstractlogger.String("import", externalImport),
			)
			b.externalImports = append(b.externalImports, externalImport)
			retry = true
			continue
		}
		if strings.HasPrefix(message.Text, loaderPrefix) {
			missingLoader := strings.TrimPrefix(message.Text, loaderPrefix)
			idx := strings.Index(missingLoader, "\"")
			if idx == -1 {
				continue
			}
			missingLoader = missingLoader[:idx]
			for _, loader := range b.fileLoaders {
				if loader == missingLoader {
					continue WithNextError
				}
			}
			b.log.Debug("Bundler: configuring file loader",
				abstractlogger.String("import", missingLoader),
			)
			b.fileLoaders = append(b.fileLoaders, missingLoader)
			retry = true
			continue
		}
	}
	return retry
}

func (b *Bundler) initialBuild() api.BuildResult {
	options := api.BuildOptions{
		Outfile:     b.outFile,
		EntryPoints: []string{b.entryPoint},
		Bundle:      true,
		Incremental: true,
		Platform:    api.PlatformNode,
		Loader: map[string]api.Loader{
			".json": api.LoaderJSON,
		},
		Format:   api.FormatCommonJS,
		Color:    api.ColorAlways,
		External: append(b.externalImports, "./node_modules/*"),
		Engines: []api.Engine{
			{Name: api.EngineNode, Version: "12"}, // Maintenance
			{Name: api.EngineNode, Version: "16"}, // LTS
		},
		Write:       true,
		TreeShaking: api.TreeShakingTrue,
	}

	watchTypescriptFile := func(file string) {
		// typescript imports have no file extension
		// we need to check if the real file exists and append the extension
		_, err := os.Stat(file)
		if os.IsNotExist(err) {
			if fileInfo, err := os.Stat(file + ".ts"); err == nil {
				if !fileInfo.IsDir() {
					file += ".ts"
				}
			}
		}

		// check if we want to ignore the file
		ignore := false
		for _, ignorePath := range b.ignorePaths {
			if strings.Contains(file, ignorePath) {
				ignore = true
				break
			}
		}

		if !ignore {
			// check if the path already exist
			exists := false
			for _, watchPath := range b.watchPaths {
				if watchPath == file {
					exists = true
					break
				}
			}
			if !exists {
				if len(b.watchPaths) < watchFileLimit {
					// each plugin runs on a separate go routine
					b.mu.Lock()
					defer b.mu.Unlock()
					b.watchPaths = append(b.watchPaths, file)
				} else {
					b.log.Fatal("Config Bundler: watching limit exceeded", abstractlogger.String("bundler", b.name), abstractlogger.Int("limit", watchFileLimit), abstractlogger.Error(err))
				}

			}
		}
	}

	options.Plugins = append(options.Plugins, api.Plugin{
		Name: "watch-imports",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{Filter: `.*`},
				func(args api.OnResolveArgs) (api.OnResolveResult, error) {
					file := filepath.Join(args.ResolveDir, args.Path)

					if args.Kind == api.ResolveJSImportStatement || (!b.skipWatchOnEntryPoint && args.Kind == api.ResolveEntryPoint) {
						isExternal := NonNodeModuleReg.MatchString(args.Path)
						if isExternal {
							return api.OnResolveResult{
								External: true,
							}, nil
						}
						watchTypescriptFile(file)
					}

					return api.OnResolveResult{}, nil
				})
		}})

	if b.enableProcessEnvUsagePlugin {
		options.Plugins = append(options.Plugins, b.processEnvUsagePlugin())
	}

	for _, loader := range b.fileLoaders {
		options.Loader[loader] = api.LoaderText
	}
	result := api.Build(options)
	return result
}

func (b *Bundler) processEnvUsagePlugin() api.Plugin {
	return api.Plugin{
		Name: "process-env-usage",
		Setup: func(build api.PluginBuild) {
			build.OnLoad(api.OnLoadOptions{
				Filter: `\.ts$`,
			}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				file, err := ioutil.ReadFile(args.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				contents := string(file)
				if strings.Contains(args.Path, "node_modules") {
					return api.OnLoadResult{
						Contents: &contents,
						Loader:   api.LoaderTS,
					}, nil
				}
				reader := bufio.NewReader(bytes.NewReader(file))
				linesRead := 0
				foundProcessEnvUsage := false
				for {
					line, err := reader.ReadString('\n')
					if err != nil {
						if err == io.EOF {
							break
						}
						return api.OnLoadResult{}, err
					}
					linesRead++
					// check if the line contains a process.env usage
					if strings.Contains(line, "process.env") {
						fmt.Printf("\nfound usage of process.env in file:\n%s:%d\n\n%s\n\n", args.Path, linesRead, line)
						foundProcessEnvUsage = true
					}
				}
				if foundProcessEnvUsage {
					fmt.Printf("You're using process.env during the generation of the wundergraph.config.json.\n" +
						"This means that all used environment variables must be present at this time.\n" +
						"Additionally, all used environment variables will be passed to the wundergraph.config.json.\n" +
						"This might be unintentional, as you might want to keep environment variables out of the wundergraph.config.json file.\n" +
						"If that's the case, please replace process.env.FOO with 'new EnvironmentVariable(\"FOO\")'\n" +
						"This will defer resolving the environment variable until 'wunderctl start'\n" +
						"It's ok to use process.env to manipulate the configuration.\n" +
						"However, you shouldn't be using process.env with Secrets, API keys, etc...\n\n",
					)
				}
				return api.OnLoadResult{
					Contents: &contents,
					Loader:   api.LoaderTS,
				}, nil
			})
		},
	}
}

func (b *Bundler) watch(rebuild func() api.BuildResult) {

	if b.skipWatch {
		return
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		b.log.Fatal("Config Bundler: unable to setup file watcher", abstractlogger.String("bundler", b.name), abstractlogger.Error(err))
	}
	defer watcher.Close()

	go func() {
		for {
			select {
			case <-b.stopFileWatchChan:
				return
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Op&fsnotify.Chmod == fsnotify.Chmod {
					continue
				}
				if b.skip(event.Name) {
					continue
				}
				b.log.Debug("Config Bundler: file change detected",
					abstractlogger.String("bundler", b.name),
					abstractlogger.String("file", event.Name),
				)
				rebuild()

				b.run(false)

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				b.log.Debug("Config Bundler: error watching files", abstractlogger.String("bundler", b.name), abstractlogger.Error(err))
			}
		}
	}()

	for _, path := range b.watchPaths {
		err = watcher.Add(path)
		if err != nil {
			b.log.Fatal("Config Bundler: error adding files to file watcher", abstractlogger.String("bundler", b.name), abstractlogger.String("path", path), abstractlogger.Error(err))
		}
	}

	<-b.stopFileWatchChan
	b.log.Debug("Config Bundler: stopped watching", abstractlogger.String("bundler", b.name))
}

func (b *Bundler) skip(changedPath string) bool {
	for _, ignorePath := range b.ignorePaths {
		if strings.Contains(changedPath, ignorePath) {
			return true
		}
	}
	return false
}

func (b *Bundler) run(blocking bool) {
	if b.cancel != nil {
		b.cancel()
	}

	b.stopCmdChan = make(chan struct{})

	b.log.Debug("Config Bundler: execute script", abstractlogger.String("bundler", b.name))

	ctx, cancel := context.WithCancel(context.Background())
	b.cancel = cancel

	cmd := exec.CommandContext(ctx, "node", b.outFile)
	cmd.Env = append(cmd.Env, os.Environ()...)
	cmd.Env = append(cmd.Env, b.scriptEnv...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if blocking {
		b.runCmd(ctx, cmd)
	} else {
		go b.runCmd(ctx, cmd)
	}
}

func (b *Bundler) runCmd(ctx context.Context, cmd *exec.Cmd) {
	defer close(b.stopCmdChan)

	err := cmd.Run()
	if err != nil {
		if ctx.Err() == context.Canceled {
			b.log.Debug("Config Bundler: script exited due to context cancelling", abstractlogger.Error(err), abstractlogger.String("bundler", b.name))
			return
		}
		// If the command was killed, we exit the main process as well
		if exitErr, ok := err.(*exec.ExitError); ok {
			b.log.Fatal("Config Bundler: error executing script", abstractlogger.Error(err), abstractlogger.String("bundler", b.name), abstractlogger.Int("exitCode", exitErr.ExitCode()))
		} else {
			b.log.Fatal("Config Bundler: error executing script", abstractlogger.Error(err), abstractlogger.String("bundler", b.name))
		}
		return
	}

	b.log.Debug("Config Bundler: script executed", abstractlogger.String("bundler", b.name))
}
