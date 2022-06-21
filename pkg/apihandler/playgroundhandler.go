package apihandler

import (
	"net/http"
	"path"

	"github.com/gorilla/mux"
	"github.com/wundergraph/graphql-go-tools/pkg/playground"
)

func registerGraphqlPlaygroundHandler(router *mux.Router, pathPrefix string, apiPath string) (err error) {
	p := playground.New(playground.Config{
		PathPrefix:                      "",
		PlaygroundPath:                  apiPath,
		GraphqlEndpointPath:             path.Join("/", pathPrefix, apiPath),
		GraphQLSubscriptionEndpointPath: path.Join("/", pathPrefix, apiPath),
	})

	handlers, err := p.Handlers()

	if err != nil {
		return err
	}

	for i := range handlers {
		router.Methods(http.MethodGet, http.MethodOptions).Path(handlers[i].Path).Handler(handlers[i].Handler)
	}

	return nil
}
