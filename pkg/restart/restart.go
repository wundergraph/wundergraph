// Package restart implements functions for self restarting a process
package restart

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
)

type Options struct {
	// Args allows the caller to alter the arguments passed
	// to the restarted process. Args will be called with
	// all the command arguments (including args[0]) and should
	// return a slice with the new arguments to be used.
	Args func(args []string) []string
}

func ppidEnvKey() string {
	name := strings.ToUpper(filepath.Base(os.Args[0]))
	return fmt.Sprintf("%s_PPID", name)
}

// Await must be called early during the startup to make the
// restarted process await for its parent to exit
func Await() {
	envKey := ppidEnvKey()
	ppid := os.Getppid()
	ppidFromEnv, _ := strconv.Atoi(os.Getenv(envKey))
	if ppidFromEnv > 0 && ppidFromEnv == ppid {
		proc, _ := os.FindProcess(ppid)
		if proc != nil {
			for {
				if err := proc.Signal(syscall.Signal(0)); err != nil {
					break
				}
			}
			os.Unsetenv(envKey)
		}
	}
}

// Restart triggers the restart process by starting the child, which will
// stop at Await until the parent exits. Note that this function doesn't
// exit the parent, the caller is responsible to do that.
func Restart(opts *Options) error {
	os.Setenv(ppidEnvKey(), strconv.Itoa(os.Getpid()))
	args := os.Args
	if opts != nil && opts.Args != nil {
		args = opts.Args(args)
	}
	p, err := exec.LookPath(args[0])
	if err != nil {
		return err
	}

	if runtime.GOOS == "windows" {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}

		files := make([]*os.File, 3)
		files[syscall.Stdin] = os.Stdin
		files[syscall.Stdout] = os.Stdout
		files[syscall.Stderr] = os.Stderr

		_, err = os.StartProcess(p, args, &os.ProcAttr{
			Dir:   wd,
			Files: files,
		})
		if nil != err {
			return err
		}

	} else {
		syscall.Exec(p, args, os.Environ())
	}

	return nil
}
