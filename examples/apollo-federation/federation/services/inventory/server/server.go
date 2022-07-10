package main

import (
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/vektah/gqlparser"

	"inventory"
)

const defaultPort = "4004"

func main() {
	gqlparser.MustLoadSchema()
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}
	srv := handler.New(inventory.NewExecutableSchema(inventory.Config{Resolvers: &inventory.Resolver{}}))
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	})
	srv.Use(extension.Introspection{})

	http.Handle("/", playground.Handler("GraphQL playground", "/graphql"))
	http.Handle("/graphql", srv)
	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
