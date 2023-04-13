package watcher

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/bep/debounce"
	"github.com/fsnotify/fsnotify"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

// build upon https://github.com/livebud/bud/blob/main/package/watcher/watcher.go

var Stop = errors.New("stop watching")

// Arbitrarily picked after some manual testing. OSX is pretty fast, but Ubuntu
// requires a longer delay for writes. Duplicate checks below allow us to keep
// this snappy.
var debounceDelay = 20 * time.Millisecond

func newPathSet() *pathSet {
	return &pathSet{
		paths: map[string]struct{}{},
	}
}

type WatchPath struct {
	Optional bool
	Path     string
}

// pathSet is used to collect paths that have changed and flush them all at once
// when the watch function is triggered.
type pathSet struct {
	mu    sync.RWMutex
	paths map[string]struct{}
}

// Add a path to the set
func (p *pathSet) Add(path string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.paths[path] = struct{}{}
}

// Flush the stored paths and clear the path set.
func (p *pathSet) Flush() (paths []string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	for path := range p.paths {
		paths = append(paths, path)
	}
	sort.Strings(paths)
	p.paths = map[string]struct{}{}
	return paths
}

type Config struct {
	// WatchPaths is the list of filenames or directories to watch for changes.
	WatchPaths []*WatchPath
	// IgnorePaths is the list of patterns to ignore for changes.
	IgnorePaths []string
}

type Watcher struct {
	name   string
	config *Config
	log    *zap.Logger
}

func NewWatcher(name string, config *Config, log *zap.Logger) *Watcher {
	return &Watcher{
		name:   name,
		config: config,
		log:    log,
	}
}

// Watch function
func (b *Watcher) Watch(ctx context.Context, fn func(paths []string) error) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer watcher.Close()
	// Trigger is debounced to group events together
	errorCh := make(chan error)
	pathset := newPathSet()
	debounce := debounce.New(debounceDelay)
	trigger := func(path string) {
		pathset.Add(path)
		debounce(func() {
			paths := pathset.Flush()
			b.log.Info("File change detected", zap.String("watcherName", b.name), zap.Strings("paths", paths))
			if err := fn(paths); err != nil {
				errorCh <- err
			}
		})
	}
	// Avoid duplicate events by checking the stamp of the file. This allows us
	// to bring down the debounce delay to trigger events faster.
	// TODO: bound this map
	duplicates := map[string]struct{}{}
	isDuplicate := func(path string, stat fs.FileInfo) bool {
		stamp, err := computeStamp(path, stat)
		if err != nil {
			return false
		}
		// Duplicate check
		if _, ok := duplicates[stamp]; ok {
			return true
		}
		duplicates[stamp] = struct{}{}
		return false
	}
	// Files to ignore while walking the directory
	shouldIgnore := func(path string, de fs.DirEntry) error {
		if b.skip(path) || filepath.Base(path) == ".git" {
			return filepath.SkipDir
		}
		return nil
	}
	// For some reason renames are often emitted instead of
	// Remove. Check it and correct.
	rename := func(path string) error {
		_, err := os.Stat(path)
		if nil == err {
			return nil
		}
		// If it's a different error, ignore
		if !errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		// Remove the path and emit an update
		watcher.Remove(path)
		// Trigger an update
		trigger(path)
		return nil
	}
	// Remove the file or directory from the watcher.
	// We intentionally ignore errors for this case.
	remove := func(path string) error {
		watcher.Remove(path)
		// Trigger an update
		trigger(path)
		return nil
	}
	// Watching a file or directory as long as it's not inside .gitignore.
	// Ignore most errors since missing a file isn't the end of the world.
	// If a new directory is created, add and trigger all the files within
	// that directory.
	var create func(path string) error
	create = func(path string) error {
		// Stat the file
		stat, err := os.Stat(path)
		if err != nil {
			return nil
		}
		if b.skip(path) {
			return nil
		}
		if isDuplicate(path, stat) {
			return nil
		}
		err = watcher.Add(path)
		if err != nil {
			return err
		}
		// If it's a directory, walk the dir and trigger creates
		// because those create events won't happen on their own
		if stat.IsDir() {
			des, err := os.ReadDir(path)
			if err != nil {
				return err
			}
			for _, de := range des {
				if err := create(filepath.Join(path, de.Name())); err != nil {
					return err
				}
			}
			trigger(path)
			return nil
		}
		// Otherwise, trigger the create
		trigger(path)
		return nil
	}
	// A file or directory has been updated. Notify our matchers.
	write := func(path string) error {
		// Stat the file
		stat, err := os.Stat(path)
		if err != nil {
			return nil
		}
		if b.skip(path) {
			return nil
		}
		if isDuplicate(path, stat) {
			return nil
		}
		// Trigger an update
		trigger(path)
		return nil
	}

	// Walk the files, adding files that aren't ignored
	for _, wPath := range b.config.WatchPaths {
		if err := filepath.WalkDir(wPath.Path, func(path string, de fs.DirEntry, err error) error {
			if err != nil {
				// Skip errors for optional directories
				if wPath.Optional && os.IsNotExist(err) {
					b.log.Debug("not watching non existing optional path",
						zap.String("watcherName", b.name),
						zap.String("path", wPath.Path),
					)
					return nil
				}
				return err
			}

			if err := shouldIgnore(path, de); err != nil {
				return err
			}
			watcher.Add(path)
			return nil
		}); err != nil {
			return err
		}
	}

	// Watch for file events!
	// Note: The FAQ currently says it needs to be in a separate Go routine
	// https://github.com/fsnotify/fsnotify#faq, so we'll do that.
	eg, ctx := errgroup.WithContext(ctx)
	eg.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				return nil
			case err := <-errorCh:
				return err
			case err := <-watcher.Errors:
				return err
			case evt := <-watcher.Events:
				// Sometimes the event name can be empty on Linux during deletes. Ignore
				// those events.
				if evt.Name == "" {
					continue
				}

				// Switch over the operations
				switch op := evt.Op; {

				// Handle rename events
				case op&fsnotify.Rename != 0:
					if err := rename(evt.Name); err != nil {
						return err
					}

				// Handle remove events
				case op&fsnotify.Remove != 0:
					if err := remove(evt.Name); err != nil {
						return err
					}

				// Handle create events
				case op&fsnotify.Create != 0:
					if err := create(evt.Name); err != nil {
						return err
					}

				// Handle write events
				case op&fsnotify.Write != 0:
					if err := write(evt.Name); err != nil {
						return err
					}
				}
			}
		}
	})
	// Wait for the watcher to complete
	if err := eg.Wait(); err != nil {
		if !errors.Is(err, Stop) {
			return err
		}
		return nil
	}
	return nil
}

func (b *Watcher) skip(changedPath string) bool {
	for _, ignorePath := range b.config.IgnorePaths {
		if strings.Contains(changedPath, ignorePath) {
			return true
		}
	}
	return false
}

// computeStamp uses path, size, mode and modtime to try and ensure this is a
// unique event.
func computeStamp(path string, stat fs.FileInfo) (stamp string, err error) {
	mtime := stat.ModTime().UnixNano()
	mode := stat.Mode()
	size := stat.Size()
	stamp = path + ":" + strconv.Itoa(int(size)) + ":" + mode.String() + ":" + strconv.Itoa(int(mtime))
	return stamp, nil
}
