package scriptrunner

import (
	"fmt"
	gocmd "github.com/go-cmd/cmd"
	"github.com/smallnest/ringbuffer"
	"go.uber.org/zap"
	"golang.org/x/net/context"
	"os"
)

type Config struct {
	Name       string
	Executable string
	ScriptArgs []string
	// ScriptEnv is the environment variables that are always passed to the script.
	ScriptEnv []string
	// ScriptEnv are environment variables that are only set on the first script run.
	FirstRunEnv   []string
	AbsWorkingDir string
	Logger        *zap.Logger
	// SuppressStdStreams suppresses the output of the script to stdout and stderr.
	SuppressStdStreams bool
}

type ScriptRunner struct {
	name               string
	fatalOnStop        bool
	executable         string
	scriptArgs         []string
	scriptEnv          []string
	firstRunEnv        []string
	absWorkingDir      string
	firstRun           bool
	cmdDoneChan        chan struct{}
	log                *zap.Logger
	cmd                *gocmd.Cmd
	stdErrBuf          *ringbuffer.RingBuffer
	stdoutBuf          *ringbuffer.RingBuffer
	suppressStdStreams bool
}

func NewScriptRunner(config *Config) *ScriptRunner {

	return &ScriptRunner{
		name:               config.Name,
		log:                config.Logger,
		firstRunEnv:        config.FirstRunEnv,
		absWorkingDir:      config.AbsWorkingDir,
		executable:         config.Executable,
		scriptArgs:         config.ScriptArgs,
		scriptEnv:          config.ScriptEnv,
		firstRun:           true,
		stdErrBuf:          ringbuffer.New(1024 * 1024),
		stdoutBuf:          ringbuffer.New(1024 * 1024),
		suppressStdStreams: config.SuppressStdStreams,
	}
}

func (b *ScriptRunner) ExitCode() int {
	if b.cmd != nil {
		status := b.cmd.Status()
		return status.Exit
	}
	return 0
}

func (b *ScriptRunner) Stop() error {
	if b.cmd != nil {
		err := b.cmd.Stop()

		b.stdoutBuf.Reset()
		b.stdErrBuf.Reset()

		// blocking until the script is done
		<-b.cmdDoneChan

		return err
	}
	return nil
}

func (b *ScriptRunner) Error() error {
	if b.cmd != nil {
		status := b.cmd.Status()
		// rely only on the status code if there is no error
		// error is also set when the process was terminated by a signal which is not an error
		if status.Exit > 0 {
			return fmt.Errorf("script %s failed with exit code %d:\n%s", b.name, status.Exit, b.stdErrBuf.Bytes())
		}
	}
	return nil
}

// Successful returns true if the script exited with <= 0 and without an error.
// This method should only be called after the script is done.
func (b *ScriptRunner) Successful() bool {
	if b.cmd != nil {
		status := b.cmd.Status()
		if status.Error != nil || status.Exit > 0 {
			return false
		}
	}
	return true
}

func (b *ScriptRunner) Run(ctx context.Context) chan struct{} {
	err := b.Stop()
	if err != nil {
		b.log.Debug("Stopping runner failed",
			zap.String("runnerName", b.name),
			zap.Error(err),
		)
	}

	cmdOptions := CmdOptions{
		executable:         b.executable,
		cmdDir:             b.absWorkingDir,
		scriptArgs:         b.scriptArgs,
		scriptEnv:          b.scriptEnv,
		stdErrBuf:          b.stdErrBuf,
		stdoutBuf:          b.stdoutBuf,
		suppressStdStreams: b.suppressStdStreams,
	}

	if b.firstRun {
		b.firstRun = false
		cmdOptions.scriptEnv = append(cmdOptions.scriptEnv, b.firstRunEnv...)
	}

	cmd, doneChan := newCmd(cmdOptions)
	b.cmd = cmd
	b.cmdDoneChan = doneChan

	// the script is either stopped by cancelling the context or when the script is done
	go func() {
		select {
		case <-ctx.Done():
			err := b.cmd.Stop()
			if err != nil {
				b.log.Error("Stopping runner failed",
					zap.String("runnerName", b.name),
					zap.Error(err),
				)
			}
			status := b.cmd.Status()
			b.log.Debug("Script runner context cancelled",
				zap.String("runnerName", b.name),
				zap.Int("exit", status.Exit),
				zap.Int64("startTs", status.StartTs),
				zap.Int64("stopTs", status.StopTs),
				zap.Bool("complete", status.Complete),
			)
		case <-b.cmd.Done():
			status := b.cmd.Status()
			// exit code == -1 means the script was killed by a signal
			// this is intentional and not an error and happens
			// when we re-start the process after a watched file has changed
			if status.Exit == -1 {
				b.log.Debug("Script runner exited with -1 exit code",
					zap.String("runnerName", b.name),
					zap.Int("exit", status.Exit),
					zap.Error(status.Error),
					zap.Int64("startTs", status.StartTs),
					zap.Int64("stopTs", status.StopTs),
					zap.Bool("complete", status.Complete),
				)
				return
			}
			if status.Error != nil || status.Exit > 0 {
				b.log.Error("Script runner exited with non-zero exit code",
					zap.String("runnerName", b.name),
					zap.Int("exit", status.Exit),
					zap.Error(status.Error),
					zap.Int64("startTs", status.StartTs),
					zap.Int64("stopTs", status.StopTs),
					zap.Bool("complete", status.Complete),
				)
			} else {
				b.log.Debug("Script runner is done",
					zap.String("runnerName", b.name),
					zap.Int("exit", status.Exit),
					zap.Int64("startTs", status.StartTs),
					zap.Int64("stopTs", status.StopTs),
					zap.Bool("complete", status.Complete),
				)
			}
		}
	}()

	b.cmd.Start()
	b.log.Debug("Start runner",
		zap.String("runnerName", b.name),
		zap.Error(err),
	)

	return doneChan
}

type CmdOptions struct {
	executable         string
	cmdDir             string
	scriptArgs         []string
	scriptEnv          []string
	stdErrBuf          *ringbuffer.RingBuffer
	stdoutBuf          *ringbuffer.RingBuffer
	suppressStdStreams bool
}

// newCmd creates a new command to run the bundler script.
// it returns a channel that is closed when the command is done.
// this is necessary to make sure the IO was flushed after the script is stopped.
func newCmd(options CmdOptions) (*gocmd.Cmd, chan struct{}) {
	cmdOptions := gocmd.Options{
		Buffered:  false,
		Streaming: true,
	}
	cmd := gocmd.NewCmdOptions(cmdOptions, options.executable, options.scriptArgs...)
	cmd.Dir = options.cmdDir
	cmd.Env = append(cmd.Env, options.scriptEnv...)

	doneChan := make(chan struct{})

	// stream IO
	go func() {
		defer close(doneChan)
		// Done when both channels have been closed
		// https://dave.cheney.net/2013/04/30/curious-channels
		for cmd.Stdout != nil || cmd.Stderr != nil {
			select {
			case line, open := <-cmd.Stdout:
				if !open {
					cmd.Stdout = nil
					continue
				}
				if !options.suppressStdStreams {
					fmt.Println(line)
				} else {
					options.stdoutBuf.WriteString(line + "\n")
				}
			case line, open := <-cmd.Stderr:
				if !open {
					cmd.Stderr = nil
					continue
				}
				if !options.suppressStdStreams {
					fmt.Fprintln(os.Stderr, line)
				} else {
					options.stdErrBuf.WriteString(line + "\n")
				}
			}
		}
	}()

	return cmd, doneChan
}
