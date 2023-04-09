package interactive

import "github.com/charmbracelet/lipgloss"

var (
	Color    = lipgloss.AdaptiveColor{Light: "#111222", Dark: "#FAFAFA"}
	Primary  = lipgloss.Color("#a855f7")
	Green    = lipgloss.Color("#839788")
	Rose     = lipgloss.Color("#E5D1D0")
	Red      = lipgloss.Color("#D1495B")
	White    = lipgloss.Color("#ffffff")
	Black    = lipgloss.Color("#000000")
	Orange   = lipgloss.Color("#EDAE49")
	Feint    = lipgloss.AdaptiveColor{Light: "#333333", Dark: "#888888"}
	Disabled = lipgloss.AdaptiveColor{Light: "#d0d7de", Dark: "#d0d7de"}
	Iris     = lipgloss.Color("#5D5FEF")
	Fuschia  = lipgloss.Color("#EF5DA8")

	SpinnerStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("69"))

	TextStyle         = lipgloss.NewStyle().Foreground(Color)
	HeadlineTextStyle = lipgloss.NewStyle().Foreground(Primary)
	DisabledStyle     = lipgloss.NewStyle().Foreground(Disabled)
	FeintStyle        = TextStyle.Copy().Foreground(Feint)
	BoldStyle         = TextStyle.Copy().Bold(true)

	PassStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#ffffff")).Background(lipgloss.Color("#A6A867")).Padding(0, 1)
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
	err := lipgloss.NewStyle().Foreground(Orange).Bold(true).Render("Warning: ")
	content := lipgloss.NewStyle().Bold(true).Foreground(Orange).Padding(0, 1).Render(msg)
	return err + content
}
