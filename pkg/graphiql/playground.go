package graphiql

import (
	_ "embed"
)

//go:embed graphiql.html
var s string

func GetGraphiqlPlaygroundHTML() string {
	return s
}
