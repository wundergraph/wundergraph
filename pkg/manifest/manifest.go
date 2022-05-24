package manifest

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path"
	"strings"
	"text/template"

	"github.com/fatih/color"

	"github.com/jensneuse/abstractlogger"
	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"
)

const (
	manifestFileName = "wundergraph.manifest.json"
)

type Manifest struct {
	log            abstractlogger.Logger
	client         *v2wundergraphapi.Client
	Dependencies   []string `json:"dependencies"`
	wundergraphDir string
	hasChanges     bool
}

func New(log abstractlogger.Logger, client *v2wundergraphapi.Client, wundergraphDir string) *Manifest {
	return &Manifest{
		log:            log,
		client:         client,
		wundergraphDir: wundergraphDir,
	}
}

// Load loads the WunderGraph manifest from the file system.
func (m *Manifest) Load() error {
	manifestPath := path.Join(m.wundergraphDir, manifestFileName)
	if _, err := os.Stat(manifestPath); errors.Is(err, os.ErrNotExist) {
		return nil
	}
	content, err := ioutil.ReadFile(manifestPath)
	if err != nil {
		return err
	}
	err = json.Unmarshal(content, m)
	if err != nil {
		return err
	}
	m.removeDuplicates()
	return nil
}

func (m *Manifest) removeDuplicates() {
	for i, dependency := range m.Dependencies {
		for j, dependency2 := range m.Dependencies {
			if i == j {
				continue
			}
			if dependency == dependency2 {
				m.log.Info("removing duplicate dependency",
					abstractlogger.String("dependency", dependency),
				)
				m.hasChanges = true
				m.Dependencies = append(m.Dependencies[:j], m.Dependencies[j+1:]...)
				m.removeDuplicates()
				return
			}
		}
	}
}

func (m *Manifest) PersistChanges() error {
	if !m.hasChanges {
		return nil
	}
	return m.Save()
}

// Save saves the WunderGraph manifest to the file system.
func (m *Manifest) Save() error {
	manifestPath := path.Join(m.wundergraphDir, manifestFileName)
	content, err := json.MarshalIndent(*m, "", "  ")
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(manifestPath, content, os.ModePerm)
	if err != nil {
		return err
	}
	m.log.Info("wundergraph.manifest.json updated")
	return nil
}

func (m *Manifest) AddDependencies(dependencies []string) error {
	if err := m.Load(); err != nil {
		return err
	}
	m.Dependencies = append(m.Dependencies, dependencies...)
	m.log.Info("added dependencies to wundergraph.manifest.json",
		abstractlogger.Strings("dependencies", dependencies),
	)

	green := color.New(color.FgHiGreen)
	_, _ = green.Printf("API dependencies added successfully: %s\n", strings.Join(dependencies, ","))

	m.removeDuplicates()
	m.hasChanges = true
	return nil
}

func (m *Manifest) RemoveDependencies(dependencies []string) error {
	if err := m.Load(); err != nil {
		return err
	}
	for _, dependency := range dependencies {
		for i, d := range m.Dependencies {
			if d == dependency {
				m.log.Info("dependency removed",
					abstractlogger.String("dependency", dependency),
				)
				m.Dependencies = append(m.Dependencies[:i], m.Dependencies[i+1:]...)
				m.hasChanges = true
				break
			}
		}
	}
	green := color.New(color.FgHiBlue)
	green.Printf("All packages '%s' have been removed successfully!\n", strings.Join(dependencies, ","))

	return nil
}

func (m *Manifest) RenderIntegrationsTemplate(out io.Writer) error {
	if m.Dependencies == nil {
		err := m.Load()
		if err != nil {
			return err
		}
	}
	apis := make([]*v2wundergraphapi.ApiDependency, 0, len(m.Dependencies))

	for i := range m.Dependencies {
		m.log.Debug("Fetch dependency", abstractlogger.String("dependency", m.Dependencies[i]))

		dependency, err := m.client.GetApiDependency(m.Dependencies[i])
		if err != nil {
			m.log.Error("failed to load dependency, skipping",
				abstractlogger.String("dependency", m.Dependencies[i]),
				abstractlogger.Error(err),
			)
			red := color.New(color.FgHiRed)
			_, _ = red.Printf("Failed to load API dependency '%s', please try again.\n", m.Dependencies[i])
			continue
		}
		m.log.Info("dependency resolved",
			abstractlogger.String("dependency", m.Dependencies[i]),
		)
		apis = append(apis, dependency)
	}
	return m.renderIntegrations(apis, out)
}

func (m *Manifest) WriteIntegrationsFile() error {
	out := &bytes.Buffer{}
	err := m.RenderIntegrationsTemplate(out)
	if err != nil {
		return err
	}

	err = os.MkdirAll(path.Join(m.wundergraphDir, "generated"), os.ModePerm)
	if err != nil {
		return err
	}

	outPath := path.Join(m.wundergraphDir, "generated", "wundergraph.integrations.ts")
	err = os.WriteFile(outPath, out.Bytes(), os.ModePerm)
	if err != nil {
		return err
	}

	m.log.Info(fmt.Sprintf("%s updated", outPath))

	return err
}

func (m *Manifest) renderIntegrations(dependencies []*v2wundergraphapi.ApiDependency, out io.Writer) error {
	data := IntegrationsTemplateData{
		Organizations: []*Organization{},
	}
WithNext:
	for _, dependency := range dependencies {
		variablesAreOptional := true
		for _, variable := range dependency.Placeholders {
			if !variable.Optional {
				variablesAreOptional = false
				break
			}
		}
		apiJSON, err := json.Marshal(dependency)
		if err != nil {
			m.log.Error("failed to stringify api",
				abstractlogger.String("dependency", dependency.Name),
				abstractlogger.Error(err),
			)
			continue
		}
		rawConfig := string(apiJSON)
		for _, organization := range data.Organizations {
			if organization.Name == dependency.Organization {
				organization.Apis = append(organization.Apis, &Api{
					Name:                 dependency.Name,
					HasVariables:         len(dependency.Placeholders) > 0,
					Dependency:           dependency,
					RawConfig:            rawConfig,
					VariablesAreOptional: variablesAreOptional,
				})
				continue WithNext
			}
		}
		data.Organizations = append(data.Organizations, &Organization{
			Name: dependency.Organization,
			Apis: []*Api{
				{
					Name:                 dependency.Name,
					HasVariables:         len(dependency.Placeholders) > 0,
					Dependency:           dependency,
					RawConfig:            rawConfig,
					VariablesAreOptional: variablesAreOptional,
				},
			},
		})
	}
	tmpl, err := template.New("tmpl").Parse(integrationsTemplate)
	if err != nil {
		return err
	}
	return tmpl.Execute(out, data)
}

func escapeApiJSON(json string) string {
	out := strings.Replace(json, "'", "\\'", -1)
	out = strings.Replace(out, "\"", "\\\"", -1)
	out = strings.Replace(out, "\\n", "\\\\n", -1)
	out = strings.Replace(out, "\\t", "\\\\t", -1)
	out = strings.Replace(out, "\\r", "\\\\r", -1)
	return out
}

type IntegrationsTemplateData struct {
	Organizations []*Organization
}

type Organization struct {
	Name string
	Apis []*Api
}

type Api struct {
	Name                 string
	HasVariables         bool
	VariablesAreOptional bool
	Dependency           *v2wundergraphapi.ApiDependency
	RawConfig            string
}

const (
	integrationsTemplate = `import {resolveIntegration,Api,EnvironmentVariable} from "@wundergraph/sdk";

export const integrations = {
{{- range .Organizations}}
    {{ .Name }}: {
		{{- range .Apis }}
        {{ .Name }}: (config{{ if .VariablesAreOptional }}?{{ end }}: {
            apiNamespace?: string;
			{{- if .HasVariables }}
			variables{{ if .VariablesAreOptional }}?{{ end }}: {
				{{- range .Dependency.Placeholders }}
                "{{ .Name }}"{{ if .Optional }}?{{ end }}: string | EnvironmentVariable;
				{{- end }}
            };
			{{- end }}
        }): Promise<Api<any>> => {
            const raw = '{{ js .RawConfig }}';
			return resolveIntegration(raw,{{- if .HasVariables }} {{ if .VariablesAreOptional }}(config?.variables as {}) || {}{{ else }}config.variables as { [key: string]: string } {{end}}{{- else }}{}{{ end }},config{{ if .VariablesAreOptional }}?{{ end }}.apiNamespace)
        },
		{{- end }}
    },
{{- end }}
}
`
)
