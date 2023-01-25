package main

import (
	"log"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"

	"github.com/wundergraph/wundergraph/examples/schema-extension/server/graph"
	"github.com/wundergraph/wundergraph/examples/schema-extension/server/graph/gen"
)

func main() {
	http.Handle("/", handler.NewDefaultServer(gen.NewExecutableSchema(gen.Config{Resolvers: &graph.Resolver{}})))
	log.Fatal(http.ListenAndServe(":8081", nil))
}
