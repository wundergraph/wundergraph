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
	entryPoints           []string
	absWorkingDir         string
	watchPaths            []string
	ignorePaths           []string
	log                   abstractlogger.Logger
	skipWatchOnEntryPoint bool
	outFile               string
	outDir                string
	externalImports       []string
	fileLoaders           []string
	mu                    sync.Mutex
	buildResult           *api.BuildResult
	onAfterBundle         func()
}

type Config struct {
	Name                  string
	Logger                abstractlogger.Logger
	AbsWorkingDir         string
	SkipWatchOnEntryPoint bool
	EntryPoints           []string
	WatchPaths            []string
	IgnorePaths           []string
	OutFile               string
	OutDir                string
	OnAfterBundle         func()
}

func NewBundler(config Config) *Bundler {
	return &Bundler{
		name:                  config.Name,
		absWorkingDir:         config.AbsWorkingDir,
		outFile:               config.OutFile,
		outDir:                config.OutDir,
		entryPoints:           config.EntryPoints,
		watchPaths:            config.WatchPaths,
		ignorePaths:           config.IgnorePaths,
		skipWatchOnEntryPoint: config.SkipWatchOnEntryPoint,
		onAfterBundle:         config.OnAfterBundle,
		log:                   config.Logger,
		fileLoaders:           []string{".graphql", ".gql", ".graphqls", ".yml", ".yaml"},
	}
}

func (b *Bundler) Bundle() {
	if b.buildResult != nil {
		buildResult := b.buildResult.Rebuild()
		b.buildResult = &buildResult
		if len(b.buildResult.Errors) != 0 {
			b.log.Fatal("Build failed",
				abstractlogger.String("bundlerName", b.name),
				abstractlogger.Any("errors", b.buildResult.Errors),
			)
			return
		}
		b.log.Debug("Build successful", abstractlogger.String("bundlerName", b.name))
	} else {
		buildResult := b.initialBuild()
		b.buildResult = &buildResult
		if len(b.buildResult.Errors) != 0 {
			b.log.Fatal("Initial Build failed",
				abstractlogger.String("bundlerName", b.name),
				abstractlogger.Any("errors", b.buildResult.Errors),
			)
			return
		}
		b.log.Debug("Initial Build successful", abstractlogger.String("bundlerName", b.name))
	}
	if b.onAfterBundle != nil {
		b.onAfterBundle()
	}
}

func (b *Bundler) Watch(ctx context.Context) {
	if len(b.watchPaths) == 0 {
		return
	}
	if b.buildResult.Rebuild == nil {
		return
	}
	if len(b.watchPaths) > 0 {
		b.log.Debug("Watching for file changes",
			abstractlogger.String("bundlerName", b.name),
			abstractlogger.String("outFile", b.outFile),
			abstractlogger.Strings("externalImports", b.externalImports),
			abstractlogger.Strings("watchPaths", b.watchPaths),
			abstractlogger.Strings("fileLoaders", b.fileLoaders),
		)
		b.watch(ctx, b.buildResult.Rebuild)
	}
}

func (b *Bundler) BundleAndWatch(ctx context.Context) {
	b.Bundle()
	if len(b.watchPaths) > 0 {
		b.log.Debug("Watching for file changes",
			abstractlogger.String("bundlerName", b.name),
			abstractlogger.String("outFile", b.outFile),
			abstractlogger.Strings("externalImports", b.externalImports),
			abstractlogger.Strings("fileLoaders", b.fileLoaders),
		)
		b.watch(ctx, b.buildResult.Rebuild)
	}
}

func (b *Bundler) initialBuild() api.BuildResult {
	options := api.BuildOptions{
		Outfile:       b.outFile,
		Outdir:        b.outDir,
		EntryPoints:   b.entryPoints,
		Bundle:        true,
		Incremental:   true,
		Platform:      api.PlatformNode,
		Sourcemap:     api.SourceMapLinked,
		AbsWorkingDir: b.absWorkingDir,
		Loader: map[string]api.Loader{
			".json": api.LoaderJSON,
		},
		Format:   api.FormatCommonJS,
		Color:    api.ColorAlways,
		External: append(b.externalImports, "./node_modules/*"),
		Engines: []api.Engine{
			// https://nodejs.org/en/about/releases/
			{Name: api.EngineNode, Version: "14"}, // Maintenance
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
					b.log.Error("Bundler watching limit exceeded", abstractlogger.String("bundlerName", b.name), abstractlogger.Int("limit", watchFileLimit), abstractlogger.Error(err))
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
		err := w.Watch(ctx, func(paths []string) error {
			result := rebuild()
			if len(result.Errors) == 0 {
				if b.onAfterBundle != nil {
					b.onAfterBundle()
				}
			} else {
				for _, message := range result.Errors {
					b.log.Error("Bundler build error",
						abstractlogger.String("watcherName", b.name),
						abstractlogger.String("file", message.Location.File),
						abstractlogger.Int("line", message.Location.Line),
						abstractlogger.Int("column", message.Location.Column),
						abstractlogger.String("message", message.Text),
					)
				}
			}
			return nil
		})
		if err != nil {
			b.log.Error("Could not watch files",
				abstractlogger.String("watcherName", b.name),
				abstractlogger.Error(err),
			)
		}
	}()
}
