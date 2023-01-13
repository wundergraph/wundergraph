package main

import (
	"log"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"

	"github.com/wundergraph/wundergraph/examples/schema-extension/server/graph"
	"github.com/wundergraph/wundergraph/examples/schema-extension/server/graph/generated"
)

func main() {
	http.Handle("/", handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}})))
	log.Fatal(http.ListenAndServe(":8084", nil))
}
