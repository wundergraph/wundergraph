package validate

import (
	"fmt"
)

type ValidationFunc func(v *Validator) (valid bool, messages []string)

func MinLength(minLength int) ValidationFunc {
	return func(v *Validator) (valid bool, messages []string) {
		errMsg := []string{fmt.Sprintf("%s must be at least %d characters long", v.configPath, minLength)}
		errMsgNoString := []string{fmt.Sprintf("%s must be a string", v.configPath)}

		switch v.data.(type) {
		case *string:
			if len(*v.data.(*string)) < minLength {
				return false, errMsg
			}
		case string:
			if len(v.data.(string)) < minLength {
				return false, errMsg
			}
		default:
			return false, errMsgNoString
		}

		return true, nil
	}
}

func Length(length int) ValidationFunc {
	return func(v *Validator) (valid bool, messages []string) {
		errMsg := []string{fmt.Sprintf("%s must be exactly %d characters long", v.configPath, length)}
		errMsgNoString := []string{fmt.Sprintf("%s must be a string", v.configPath)}

		switch v.data.(type) {
		case *string:
			if len(*v.data.(*string)) != length {
				return false, errMsg
			}
		case string:
			if len(v.data.(string)) != length {
				return false, errMsg
			}
		default:
			return false, errMsgNoString
		}

		return true, nil
	}
}

func MaxLength(maxLength int) ValidationFunc {
	return func(v *Validator) (valid bool, messages []string) {
		errMsg := []string{fmt.Sprintf("%s must be at most %d characters long", v.configPath, maxLength)}
		errMsgNoString := []string{fmt.Sprintf("%s must be a string", v.configPath)}

		switch v.data.(type) {
		case *string:
			if len(*v.data.(*string)) > maxLength {
				return false, errMsg
			}
		case string:
			if len(v.data.(string)) > maxLength {
				return false, errMsg
			}
		default:
			return false, errMsgNoString
		}

		return true, nil
	}
}

func Required() ValidationFunc {
	return func(v *Validator) (valid bool, messages []string) {
		errMsg := []string{fmt.Sprintf("%s is required", v.configPath)}
		errMsgNoString := []string{fmt.Sprintf("%s must be a string", v.configPath)}

		if v.data == nil {
			return false, errMsg
		}

		switch v.data.(type) {
		case *string:
			if len(*v.data.(*string)) == 0 {
				return false, errMsg
			}
		case string:
			if v.data.(string) == "" {
				return false, errMsg
			}
		default:
			return false, errMsgNoString
		}

		return true, nil
	}
}

type Validator struct {
	configPath string
	data       any
}

func NewValidator(configPath string, data any) *Validator {
	return &Validator{
		configPath: configPath,
		data:       data,
	}
}

func (v *Validator) Validate(validatorFunc ...ValidationFunc) (valid bool, messages []string) {
	var errorMessages []string
	finalResult := true

	for _, validator := range validatorFunc {
		valid, messages := validator(v)
		if !valid {
			errorMessages = append(errorMessages, messages...)
			finalResult = false
			break
		}
	}

	return finalResult, errorMessages
}
