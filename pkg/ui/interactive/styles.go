package interactive

import "github.com/charmbracelet/lipgloss"

var (
	Color     = lipgloss.AdaptiveColor{Light: "#4C4452", Dark: "#FAFAFA"}
	Primary   = lipgloss.Color("#a855f7")
	Red       = lipgloss.Color("#852A56")
	White     = lipgloss.Color("#ffffff")
	Purple100 = lipgloss.AdaptiveColor{Light: "#9162bd", Dark: "#eeddfd"}
	Purple300 = lipgloss.AdaptiveColor{Light: "#6a359c", Dark: "#dcbbfc"}
	Purple600 = lipgloss.AdaptiveColor{Light: "#2f1845", Dark: "#c288f9"}
	Feint     = lipgloss.AdaptiveColor{Light: "#5f6771", Dark: "#9FACBD"}
	Help      = lipgloss.AdaptiveColor{Light: "#9ea4ac", Dark: "#909090"}
	Disabled  = lipgloss.AdaptiveColor{Light: "#d0d7de", Dark: "#d0d7de"}
	Seperator = lipgloss.AdaptiveColor{Light: "#d0d7de", Dark: "#d0d7de"}

	TextStyle         = lipgloss.NewStyle().Foreground(Color)
	HeadlineTextStyle = lipgloss.NewStyle().Bold(true).Foreground(Primary)
	DisabledStyle     = lipgloss.NewStyle().Foreground(Disabled)
	FeintStyle        = TextStyle.Copy().Foreground(Feint)
	HelpStyle         = TextStyle.Copy().Foreground(Help)
	BoldStyle         = TextStyle.Copy().Bold(true)
	SpinnerStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("#763bad"))
	SeparatorStyle    = lipgloss.NewStyle().Foreground(Seperator)

	PassStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#ffffff")).Background(lipgloss.Color("#5AD900")).Padding(0, 1)
	FailStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#ffffff")).Background(lipgloss.Color("#b91c1c")).Padding(0, 1)
)

// RenderError returns a formatted error string.
func RenderError(msg string) string {
	// Error applies styles to an error message
	err := lipgloss.NewStyle().Background(Red).Foreground(White).Bold(true).Padding(0, 1).Render("Error")
	content := lipgloss.NewStyle().Bold(true).Padding(0, 1).Render(msg)
	return err + content
}

// RenderWarning returns a formatted warning string.
func RenderWarning(msg string) string {
	// Error applies styles to an error message
	err := lipgloss.NewStyle().Foreground(Purple100).Bold(true).Render("Warning: ")
	content := lipgloss.NewStyle().Bold(true).Foreground(Purple100).Padding(0, 1).Render(msg)
	return err + content
}
