package main

import (
	"log"
	"net/http"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/rs/cors"
	"github.com/wundergraph/wundergraph/examples/graphql-apollo-subscripptions/chat"
)

func main() {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3080", "http://localhost:3000"},
		AllowCredentials: true,
	})

	http.Handle("/", playground.Handler("Chat", "/query"))
	http.Handle("/query", c.Handler(chat.GraphQLEndpointHandler()))

	log.Println("Playground running on: http://localhost:8085")
	log.Println("Send operations to: http://localhost:8085/query")
	log.Fatal(http.ListenAndServe(":8085", nil))
}
