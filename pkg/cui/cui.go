// Package cui implements the Console User Interface for wunderctl
package cui

import (
	"bytes"
	"fmt"
	"os"

	"github.com/eiannone/keyboard"
	"github.com/fatih/color"
	"github.com/mattn/go-isatty"
)

var (
	colorGray      = color.New(color.FgHiBlack)
	colorBoldWhite = color.New(color.FgHiWhite, color.Bold)
)

type action struct {
	Key  string
	Help string
}

type Handler interface {
	Quit()
	ClearCache()
	RebuildAndRestartApp()
	Restart(debugMode bool)
}

type UI struct {
	handler Handler
	opts    Options
	enabled bool
}

type Options struct {
	// Debug indicates whether debug mode is enabled
	// (it causes changes in the menu)
	Debug bool
}

func New(handler Handler, opts Options) *UI {
	return &UI{
		handler: handler,
		opts:    opts,
	}
}

// Open grabs the keyboard but doesn't start monitoring it. Call Close to properly
// dispose of it. To start listening for keyboard events, see Run()
func (u *UI) Open() error {
	if isatty.IsTerminal(os.Stdout.Fd()) {
		if err := keyboard.Open(); err != nil {
			return err
		}
		u.enabled = true
	}
	return nil
}

// Close closes the keyboard handle
func (u *UI) Close() {
	u.enabled = false
	_ = keyboard.Close()
}

func (u *UI) quit() {
	u.handler.Quit()
}

// PrintShortHelp prints a short help menu with the actions for help and quit
func (u *UI) PrintShortHelp() {
	if !u.enabled {
		return
	}
	var buf bytes.Buffer
	colorGray.Fprint(&buf, "press ")
	colorBoldWhite.Fprint(&buf, "h")
	colorGray.Fprint(&buf, " to show help, ")
	colorBoldWhite.Fprint(&buf, "q")
	colorGray.Fprint(&buf, " to quit")
	fmt.Fprintf(os.Stderr, "%s\n", buf.String())
}

func (u *UI) printHelp() {
	if !u.enabled {
		return
	}
	actions := []action{
		{
			Key: "h", Help: "show help",
		},
		{
			Key: "r", Help: "rebuild and restart your app",
		},
		{
			Key: "c", Help: "clear all caches",
		},
	}
	if u.opts.Debug {
		actions = append(actions, action{
			Key: "d", Help: "restart without debug mode",
		})
	} else {
		actions = append(actions, action{
			Key: "d", Help: "restart in debug mode",
		})
	}
	actions = append(actions, []action{
		{
			Key: "q", Help: "quit",
		},
	}...)
	colorBoldWhite.Fprintln(os.Stderr, "Usage")
	var buf bytes.Buffer
	for _, act := range actions {
		colorGray.Fprint(&buf, "press ")
		colorBoldWhite.Fprint(&buf, act.Key)
		colorGray.Fprintf(&buf, " to %s", act.Help)
		buf.WriteByte('\n')
	}
	// Make sure to make a single print call to avoid logs being
	// printed in the middle
	fmt.Fprint(os.Stderr, buf.String())
}

// Run listens for keypresses and runs each respective actions, indefinitely
func (u *UI) Run() {
	for {
		char, key, err := keyboard.GetKey()
		if err != nil {
			continue
		}
		switch key {
		case keyboard.KeyEsc:
		case keyboard.KeyCtrlC, keyboard.KeyCtrlD:
			u.quit()
		case 0:
			switch char {
			case 'h', 'H':
				u.printHelp()
			case 'r':
				u.handler.RebuildAndRestartApp()
			case 'c':
				u.handler.ClearCache()
			case 'd':
				u.handler.Restart(!u.opts.Debug)
			case 'q', 'Q':
				u.quit()
			}
		}
	}
}
