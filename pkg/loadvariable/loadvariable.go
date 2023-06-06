// Package loadvariable implements helper functions for retrieving values from wgpb.ConfigurationVariable
// instances. If the TS side uses InputVariable<T> (e.g. InputVariable<number> or InputVariable<boolean>)
// then the error messages returned by these functions can be used as is. This is because the only way
// to provide an invalid value would be through an environment variable (a hardcoded or default would come
// from a number or a boolean from the TS side and converted to string internally), and we can retrieve
// the environment variable name from the ConfigurationVariable and include it in the error message.
package loadvariable

import (
	"fmt"
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

// Bool retrieves the value for the given ConfigurationVariable using
// String(), then tries to parse it as a boolean. If the value is not a valid
// boolean, the error message will include the variable name (if any). If
// the value is empty, it returns (false, nil)
func Bool(variable *wgpb.ConfigurationVariable) (bool, error) {
	if variable == nil {
		return false, nil
	}
	value := String(variable)
	if value == "" {
		return false, nil
	}
	v, err := strconv.ParseBool(value)
	if err != nil {
		var varName string
		if variable.GetKind() == wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE {
			varName = variable.GetEnvironmentVariableName()
		}
		if varName != "" {
			return false, fmt.Errorf("error parsing %s = %q as a boolean: %w", varName, value, err)
		}
		return false, fmt.Errorf("error parsing %q as a boolean: %w", value, err)
	}
	return v, nil
}

// Int64 retrieves the value for the given ConfigurationVariable using
// String(), then tries to parse it as an int64. If the value is not a valid
// int64, the error message will include the variable name (if any). If
// the value is empty, it returns (0, nil)
func Int64(variable *wgpb.ConfigurationVariable) (int64, error) {
	if variable == nil {
		return 0, nil
	}
	value := String(variable)
	if value == "" {
		return 0, nil
	}
	v, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		var varName string
		if variable.GetKind() == wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE {
			varName = variable.GetEnvironmentVariableName()
		}
		if varName != "" {
			return 0, fmt.Errorf("error parsing %s = %q as an integer: %w", varName, value, err)
		}
		return 0, fmt.Errorf("error parsing %q as an integer: %w", value, err)
	}
	return v, nil
}

// Int retrieves the value for the given ConfigurationVariable using
// String(), then tries to parse it as an int. If the value is not a valid
// int, the error message will include the variable name (if any). If
// the value is empty, it returns (0, nil)
func Int(variable *wgpb.ConfigurationVariable) (int, error) {
	if variable == nil {
		return 0, nil
	}
	value := String(variable)
	if value == "" {
		return 0, nil
	}
	v, err := strconv.Atoi(value)
	if err != nil {
		var varName string
		if variable.GetKind() == wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE {
			varName = variable.GetEnvironmentVariableName()
		}
		if varName != "" {
			return 0, fmt.Errorf("error parsing %s = %q as an integer: %w", varName, value, err)
		}
		return 0, fmt.Errorf("error parsing %q as an integer: %w", value, err)
	}
	return v, nil
}

func Float64(variable *wgpb.ConfigurationVariable) (float64, error) {
	if variable == nil {
		return 0, nil
	}
	switch variable.GetKind() {
	case wgpb.ConfigurationVariableKind_ENV_CONFIGURATION_VARIABLE:
		value := os.Getenv(variable.GetEnvironmentVariableName())
		if value != "" {
			return strconv.ParseFloat(value, 64)
		}
		return strconv.ParseFloat(variable.GetEnvironmentVariableDefaultValue(), 64)
	case wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE:
		return strconv.ParseFloat(variable.GetStaticVariableContent(), 64)
	default:
		return 0, fmt.Errorf("unhandled wgpb.ConfigurationVariableKind")
	}
}
