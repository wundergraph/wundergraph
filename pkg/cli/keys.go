package cli

import "github.com/charmbracelet/bubbles/key"

// keyMap defines a set of keybindings. To work for help it must satisfy
// key.Map. It could also very easily be a map[string]key.Binding.
type keyMap struct {
	ClearConsole  key.Binding
	OpenBrowser   key.Binding
	Documentation key.Binding
	Discord       key.Binding
	OpenIssue     key.Binding
	Quit          key.Binding
}

// ShortHelp returns keybindings to be shown in the mini help view. It's part
// of the key.Map interface.
func (k keyMap) ShortHelp() []key.Binding {
	return []key.Binding{} // Not used because we always show full help
}

// FullHelp returns keybindings for the expanded help view. It's part of the
// key.Map interface.
func (k keyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{
		{k.OpenBrowser, k.Documentation},
		{k.ClearConsole, k.Quit},
		{k.Discord, k.OpenIssue},
	}
}

var keys = keyMap{
	ClearConsole: key.NewBinding(
		key.WithKeys("c"),
		key.WithHelp("c", "Clear console"),
	),
	OpenBrowser: key.NewBinding(
		key.WithKeys("o"),
		key.WithHelp("o", "Open browser"),
	),
	Discord: key.NewBinding(
		key.WithKeys("h"),
		key.WithHelp("h", "Help on discord"),
	),
	Documentation: key.NewBinding(
		key.WithKeys("d"),
		key.WithHelp("d", "Open docs"),
	),
	Quit: key.NewBinding(
		key.WithKeys("q", "esc", "ctrl+c"),
		key.WithHelp("q", "Close server"),
	),
	OpenIssue: key.NewBinding(
		key.WithKeys("i"),
		key.WithHelp("i", "Open issue"),
	),
}
