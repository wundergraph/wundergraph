package interactive

import "github.com/charmbracelet/bubbles/key"

// keyMap defines a set of keybindings. To work for help it must satisfy
// key.Map. It could also very easily be a map[string]key.Binding.
type keyMap struct {
	ClearConsole key.Binding
	OpenBrowser  key.Binding
	Discord      key.Binding
	Help         key.Binding
	Quit         key.Binding
}

// ShortHelp returns keybindings to be shown in the mini help view. It's part
// of the key.Map interface.
func (k keyMap) ShortHelp() []key.Binding {
	return []key.Binding{k.Discord, k.OpenBrowser, k.Help}
}

// FullHelp returns keybindings for the expanded help view. It's part of the
// key.Map interface.
func (k keyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{
		{k.OpenBrowser, k.ClearConsole}, // first column
		{k.Help, k.Quit},                // second column
	}
}

var keys = keyMap{
	ClearConsole: key.NewBinding(
		key.WithKeys("c"),
		key.WithHelp("c", "Clear console"),
	),
	OpenBrowser: key.NewBinding(
		key.WithKeys("o"),
		key.WithHelp("o", "Open in browser"),
	),
	Discord: key.NewBinding(
		key.WithKeys("h"),
		key.WithHelp("h", "Get help on discord"),
	),
	Help: key.NewBinding(
		key.WithKeys("?"),
		key.WithHelp("?", "toggle help"),
	),
	Quit: key.NewBinding(
		key.WithKeys("q", "esc", "ctrl+c"),
		key.WithHelp("q", "Close server"),
	),
}
