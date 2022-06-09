package bundler

import (
	"context"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/jensneuse/abstractlogger"
	"github.com/wundergraph/wundergraph/pkg/watcher"
)

const watchFileLimit = 1000

// NonNodeModuleReg copied from https://github.com/egoist/tsup/blob/dev/src/esbuild/external.ts#L5
var NonNodeModuleReg = regexp.MustCompile(`^[^./]|^\.[^./]|^\.\.[^/]`) // Must not start with "/" or "./" or "../"

type Bundler struct {
	name                  string
	entryPoint            string
	watchPaths            []string
	ignorePaths           []string
	log                   abstractlogger.Logger
	skipWatchOnEntryPoint bool
	outFile               string
	externalImports       []string
	fileLoaders           []string
	BuildDoneChan         chan struct{}
	mu                    sync.Mutex
}

type Config struct {
	Name                  string
	Logger                abstractlogger.Logger
	SkipWatchOnEntryPoint bool
	EntryPoint            string
	WatchPaths            []string
	IgnorePaths           []string
	OutFile               string
}

func NewBundler(config Config) *Bundler {
	return &Bundler{
		name:                  config.Name,
		outFile:               config.OutFile,
		entryPoint:            config.EntryPoint,
		watchPaths:            config.WatchPaths,
		ignorePaths:           config.IgnorePaths,
		skipWatchOnEntryPoint: config.SkipWatchOnEntryPoint,
		BuildDoneChan:         make(chan struct{}),
		log:                   config.Logger,
		fileLoaders:           []string{".graphql", ".gql", ".graphqls", ".yml", ".yaml"},
	}
}

func (b *Bundler) Bundle(ctx context.Context) {
	result := b.initialBuild()
	if len(result.Errors) != 0 {
		b.log.Fatal("Config Bundler: initial build failed",
			abstractlogger.String("bundler", b.name),
			abstractlogger.Any("errors", result.Errors),
		)
	} else {
		b.log.Debug("Config Bundler: initial build successful", abstractlogger.String("bundler", b.name))
		b.BuildDoneChan <- struct{}{}
	}
	if len(b.watchPaths) > 0 {
		b.log.Debug("Config Bundler: watching for file changes",
			abstractlogger.String("bundler", b.name),
			abstractlogger.String("outFile", b.outFile),
			abstractlogger.Strings("externalImports", b.externalImports),
			abstractlogger.Strings("fileLoaders", b.fileLoaders),
		)
		b.watch(ctx, result.Rebuild)
	}
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

	for _, loader := range b.fileLoaders {
		options.Loader[loader] = api.LoaderText
	}
	result := api.Build(options)
	return result
}

func (b *Bundler) watch(ctx context.Context, rebuild func() api.BuildResult) {
	w := watcher.NewWatcher(b.name, &watcher.Config{
		IgnorePaths: b.ignorePaths,
		WatchPaths:  b.watchPaths,
	}, b.log)

	go func() {
		defer close(b.BuildDoneChan)
		err := w.Watch(ctx, func(paths []string) error {
			result := rebuild()
			if len(result.Errors) == 0 {
				b.BuildDoneChan <- struct{}{}
			}
			return nil
		})
		if err != nil {
			b.log.Error("watcher",
				abstractlogger.String("watcher", b.name),
				abstractlogger.Error(err),
			)
		}
	}()
}
