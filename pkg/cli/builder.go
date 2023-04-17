package cli

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/help"
	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type ServerConfigLoaded struct {
	ServerURL                string
	Webhooks                 int32
	Operations               int32
	DatasourceConfigurations int32
	WunderctlVersion         string
	SdkVersion               string
	Authentication           bool
	FileUploads              bool
	PlaygroundEnabled        bool
}

type Error struct {
	Err error
}

type TaskStarted struct {
	Label string
}

type TaskEnded struct {
	Label string
	Err   error
}

type internalTask struct {
	Label     string
	StartTime time.Time
	Done      bool
}

type model struct {
	keys         keyMap
	help         help.Model
	err          error
	quitting     bool
	spinner      spinner.Model
	internalTask *internalTask
	serverConfig *ServerConfigLoaded
	viewHeight   int
	viewWidth    int
	ready        bool
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		m.spinner.Tick,
		tea.EnterAltScreen,
	)
}

type serverURLOpenFinished struct{ err error }

func OpenURL(serverURL string) tea.Cmd {
	return tea.ExecProcess(open(serverURL), func(err error) tea.Msg {
		return serverURLOpenFinished{err}
	})
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var (
		cmd  tea.Cmd
		cmds []tea.Cmd
	)

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, m.keys.ClearConsole):
			return m, tea.ClearScreen
		case key.Matches(msg, m.keys.OpenBrowser):
			if m.serverConfig.ServerURL != "" {
				return m, OpenURL(m.serverConfig.ServerURL)
			}
		case key.Matches(msg, m.keys.Quit):
			m.quitting = true
			return m, tea.Quit
		case key.Matches(msg, m.keys.Documentation):
			return m, OpenURL("https://docs.wundergraph.com")
		case key.Matches(msg, m.keys.OpenIssue):
			return m, OpenURL("https://github.com/wundergraph/wundergraph/issues/new/choose")
		case key.Matches(msg, m.keys.Discord):
			return m, OpenURL("https://discord.com/invite/Jjmc8TC")
		}

	case tea.WindowSizeMsg:
		if !m.ready {
			m.viewHeight = msg.Height
			m.viewWidth = msg.Width
			// If we set a width on the help menu it can gracefully truncate
			// its view as needed.
			m.help.Width = m.viewWidth
			m.ready = true
		}
	case TaskStarted:
		m.internalTask = &internalTask{
			Label: msg.Label,
			Done:  false,
		}
		m.err = nil
	case TaskEnded:
		m.internalTask.Done = true
		m.internalTask.Label = msg.Label
		m.err = msg.Err
	case ServerConfigLoaded:
		m.serverConfig = &msg
	case Error:
		m.err = msg.Err
	case serverURLOpenFinished:
		m.err = msg.err
		if msg.err != nil {
			m.err = msg.err
			return m, tea.Quit
		}
	case spinner.TickMsg:
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}

	return m, tea.Batch(cmds...)
}

func (m model) View() string {
	if !m.ready {
		return "\n  Initializing..."
	}
	if m.quitting {
		return "\n  Quitting..."
	}

	docStyle := lipgloss.NewStyle().Padding(1, 2, 1, 2)

	if m.err != nil {
		doc := strings.Builder{}
		doc.WriteString(fmt.Sprintf("%s %s\n", FailStyle.Render("FAIL"), m.err.Error()))
		return docStyle.Render(doc.String())
	}

	doc := strings.Builder{}

	title := HeadlineTextStyle.Render("WunderGraph")
	sdkVersion := ""
	if m.serverConfig.SdkVersion != "" {
		sdkVersion = fmt.Sprintf(", SDK: %s", m.serverConfig.SdkVersion)
	}
	versionString := FeintStyle.Render(fmt.Sprintf("(CLI: %s%s)", m.serverConfig.WunderctlVersion, sdkVersion))

	doc.WriteString(fmt.Sprintf("%s %s\n\n", title, versionString))

	if m.serverConfig.ServerURL != "" {
		serverURL := lipgloss.JoinHorizontal(lipgloss.Left,
			BoldStyle.Render("➜ Local: "),
			FeintStyle.Render(m.serverConfig.ServerURL),
		)
		doc.WriteString(fmt.Sprintf("%s\n", serverURL))

		if m.serverConfig.PlaygroundEnabled {
			graphiQL := lipgloss.JoinHorizontal(lipgloss.Left,
				BoldStyle.Render("➜ Playground: "),
				fmt.Sprintf("%s/graphql", m.serverConfig.ServerURL),
			)
			doc.WriteString(fmt.Sprintf("%s\n", graphiQL))
		}

		logModeHint := lipgloss.JoinHorizontal(lipgloss.Left,
			BoldStyle.Render("➜ Logs:"),
			FeintStyle.Render(" use "),
			BoldStyle.Bold(true).Render("--logs"),
			FeintStyle.Render(" to enter log mode"),
		)
		doc.WriteString(fmt.Sprintf("%s\n\n", logModeHint))
	}

	if m.internalTask != nil {
		if m.internalTask.Done {
			doc.WriteString(fmt.Sprintf("%s %s\n", PassStyle.Render("SUCCESS"), m.internalTask.Label))
		} else {
			doc.WriteString(fmt.Sprintf("%s %s\n", m.spinner.View(), m.internalTask.Label))
		}
	}

	doc.WriteString("\n")

	if m.serverConfig != nil {
		authText := DisabledStyle.Render("✖ Auth")
		if m.serverConfig.Authentication {
			authText = TextStyle.Render("✔ Auth")
		}

		fileUploadText := DisabledStyle.Render("✖ File Uploads")
		if m.serverConfig.FileUploads {
			fileUploadText = TextStyle.Render("✔ File Uploads")
		}

		doc.WriteString(
			lipgloss.JoinHorizontal(lipgloss.Left, fmt.Sprintf("%s\n%s\n%s\n",
				lipgloss.NewStyle().Foreground(Purple100).PaddingRight(2).Render(fmt.Sprintf("%d DataSources", m.serverConfig.DatasourceConfigurations)),
				lipgloss.NewStyle().Foreground(Purple300).PaddingRight(2).Render(fmt.Sprintf("%d Operations", m.serverConfig.Operations)),
				lipgloss.NewStyle().Foreground(Purple600).PaddingRight(2).Render(fmt.Sprintf("%d Webhooks", m.serverConfig.Webhooks)),
			), fmt.Sprintf("%s\n%s\n",
				authText,
				fileUploadText,
			)),
		)

		doc.WriteString("\n")
	}

	helpView := m.help.View(m.keys)

	doc.WriteString(helpView + "\n")

	return docStyle.Render(doc.String())

}

type Options struct {
	ServerVersion string
}

func NewModel(ctx context.Context, options *Options) *tea.Program {
	s := spinner.New()
	s.Spinner = spinner.MiniDot
	s.Style = SpinnerStyle

	h := help.New()
	h.ShowAll = true
	h.Styles.ShortDesc = HelpStyle
	h.Styles.FullDesc = HelpStyle
	h.Styles.FullKey = TextStyle
	h.Styles.ShortKey = TextStyle
	h.Styles.ShortSeparator = SeparatorStyle

	model := model{
		keys:         keys,
		help:         h,
		spinner:      s,
		internalTask: &internalTask{},
		serverConfig: &ServerConfigLoaded{
			WunderctlVersion: options.ServerVersion,
		},
	}

	p := tea.NewProgram(
		model,
		tea.WithContext(ctx),
		tea.WithAltScreen(),
	)

	return p
}
