package scriptrunner

import (
	"fmt"
	"os"

	gocmd "github.com/go-cmd/cmd"
	"github.com/jensneuse/abstractlogger"
	"golang.org/x/net/context"
)

type Config struct {
	Name       string
	Executable string
	ScriptArgs []string
	ScriptEnv  []string
	Logger     abstractlogger.Logger
}

type ScriptRunner struct {
	name        string
	fatalOnStop bool
	executable  string
	scriptArgs  []string
	scriptEnv   []string
	cmdDoneChan chan struct{}
	log         abstractlogger.Logger
	cmd         *gocmd.Cmd
}

func NewScriptRunner(config *Config) *ScriptRunner {
	return &ScriptRunner{
		name:       config.Name,
		log:        config.Logger,
		executable: config.Executable,
		scriptArgs: config.ScriptArgs,
		scriptEnv:  config.ScriptEnv,
	}
}

func (b *ScriptRunner) Stop() error {
	if b.cmd != nil {
		err := b.cmd.Stop()

		// blocking until the script is done
		<-b.cmdDoneChan

		return err
	}
	return nil
}

func (b *ScriptRunner) Run(ctx context.Context) chan struct{} {
	err := b.Stop()
	if err != nil {
		b.log.Debug("Stopping runner failed",
			abstractlogger.String("runnerName", b.name),
			abstractlogger.Error(err),
		)
	}

	cmd, doneChan := newCmd(b.executable, b.scriptArgs, b.scriptEnv)
	b.cmd = cmd
	b.cmdDoneChan = doneChan

	// the script is either stopped by cancelling the context or when the script is done
	go func() {
		select {
		case <-ctx.Done():
			err := b.cmd.Stop()
			if err != nil {
				b.log.Error("Stopping runner failed",
					abstractlogger.String("runnerName", b.name),
					abstractlogger.Error(err),
				)
			}
			status := b.cmd.Status()
			b.log.Debug("Script runner context cancelled",
				abstractlogger.String("runnerName", b.name),
				abstractlogger.Int("exit", status.Exit),
				abstractlogger.Any("startTs", status.StartTs),
				abstractlogger.Any("stopTs", status.StopTs),
				abstractlogger.Bool("complete", status.Complete),
			)
		case <-b.cmd.Done():
			status := b.cmd.Status()
			// exit code == -1 means the script was killed by a signal
			// this is intentional and not an error and happens when we re-start the process after a watched file has changed
			if status.Exit == -1 {
				return
			}
			if status.Error != nil {
				b.log.Error("Script runner exited with error",
					abstractlogger.String("runnerName", b.name),
					abstractlogger.Int("exit", status.Exit),
					abstractlogger.Error(status.Error),
					abstractlogger.Any("startTs", status.StartTs),
					abstractlogger.Any("stopTs", status.StopTs),
					abstractlogger.Bool("complete", status.Complete),
				)
			} else {
				b.log.Debug("Script runner is done",
					abstractlogger.String("runnerName", b.name),
					abstractlogger.Int("exit", status.Exit),
					abstractlogger.Any("startTs", status.StartTs),
					abstractlogger.Any("stopTs", status.StopTs),
					abstractlogger.Bool("complete", status.Complete),
				)
			}
		}
	}()

	b.cmd.Start()

	return doneChan
}

// newCmd creates a new command to run the bundler script.
// it returns a channel that is closed when the command is done.
// this is necessary to make sure the IO was flushed after the script is stopped.
func newCmd(executable string, scriptArgs []string, scriptEnv []string) (*gocmd.Cmd, chan struct{}) {
	cmdOptions := gocmd.Options{
		Buffered:  false,
		Streaming: true,
	}
	cmd := gocmd.NewCmdOptions(cmdOptions, executable, scriptArgs...)
	cmd.Env = append(cmd.Env, scriptEnv...)

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
				fmt.Println(line)
			case line, open := <-cmd.Stderr:
				if !open {
					cmd.Stderr = nil
					continue
				}
				fmt.Fprintln(os.Stderr, line)
			}
		}
	}()

	return cmd, doneChan
}
