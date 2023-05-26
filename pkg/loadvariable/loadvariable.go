package loadvariable

import (
	"os"
	"strconv"
	"strings"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

// String is a shorthand for LookupString when you do not care about
// the value being explicitly set
func String(variable *wgpb.ConfigurationVariable) string {
	val, _ := LookupString(variable)
	return val
}

// LookupString returns the value for the given configuration variable as well
// as wether it was explicitly set. If the variable is nil or the environment
// variable it references is not set, it returns false as its second value.
// Otherwise (e.g. environment variable set but empty, static string), the
// second return value is true. If you don't need to know if the variable
// was explicitly set, use String.
func LookupString(variable *wgpb.ConfigurationVariable) (string, bool) {
	if variable == nil {
		return "", false
	}
	switch variable.GetKind() {
	case wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE:
		if varName := variable.GetEnvironmentVariableName(); varName != "" {
			value, found := os.LookupEnv(variable.GetEnvironmentVariableName())
			if found {
				return value, found
			}
		}
		defValue := variable.GetEnvironmentVariableDefaultValue()
		return defValue, defValue != ""
	case wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE:
		return variable.GetStaticVariableContent(), true
	default:
		panic("unhandled wgpb.ConfigurationVariableKind")
	}
}

func Strings(variables []*wgpb.ConfigurationVariable) []string {
	out := make([]string, 0, len(variables))
	for _, variable := range variables {
		str := String(variable)
		if str != "" {
			out = append(out, strings.Split(str, ",")...)
		}
	}
	return out
}

func Bool(variable *wgpb.ConfigurationVariable) bool {
	if variable == nil {
		return false
	}
	switch variable.GetKind() {
	case wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE:
		value := os.Getenv(variable.GetEnvironmentVariableName())
		if value != "" {
			return value == "true"
		}
		return variable.GetEnvironmentVariableDefaultValue() == "true"
	case wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE:
		return variable.GetStaticVariableContent() == "true"
	default:
		return false
	}
}

func Int64(variable *wgpb.ConfigurationVariable) int64 {
	if variable == nil {
		return 0
	}
	switch variable.GetKind() {
	case wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE:
		value := os.Getenv(variable.GetEnvironmentVariableName())
		if value != "" {
			i, _ := strconv.Atoi(value)
			return int64(i)
		}
		i, _ := strconv.Atoi(variable.GetEnvironmentVariableDefaultValue())
		return int64(i)
	case wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE:
		i, _ := strconv.Atoi(variable.GetStaticVariableContent())
		return int64(i)
	default:
		return 0
	}
}

func Int(variable *wgpb.ConfigurationVariable) int {
	if variable == nil {
		return 0
	}
	switch variable.GetKind() {
	case wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE:
		value := os.Getenv(variable.GetEnvironmentVariableName())
		if value != "" {
			i, _ := strconv.Atoi(value)
			return i
		}
		i, _ := strconv.Atoi(variable.GetEnvironmentVariableDefaultValue())
		return i
	case wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE:
		i, _ := strconv.Atoi(variable.GetStaticVariableContent())
		return i
	default:
		return 0
	}
}

func Float64(variable *wgpb.ConfigurationVariable) float64 {
	if variable == nil {
		return 0
	}
	switch variable.GetKind() {
	case wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE:
		value := os.Getenv(variable.GetEnvironmentVariableName())
		if value != "" {
			i, _ := strconv.ParseFloat(value, 64)
			return i
		}
		i, _ := strconv.ParseFloat(variable.GetEnvironmentVariableDefaultValue(), 64)
		return i
	case wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE:
		i, _ := strconv.ParseFloat(variable.GetStaticVariableContent(), 64)
		return i
	default:
		return 0
	}
}
