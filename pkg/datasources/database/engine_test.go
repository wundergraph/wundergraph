//go:build prisma_cgo
// +build prisma_cgo

package database

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/jensneuse/goprisma"
	"github.com/stretchr/testify/assert"
)

const (
	queryString = `postgresql://admin:admin@localhost:54322/example?schema=public&connection_limit=20&pool_timeout=5`
)

func TestPrismaIntrospect(t *testing.T) {
	schema := fmt.Sprintf(`datasource db {
		provider = "%s"
		url      = "%s"
	}`, "postgresql", queryString)

	schema, sdl, err := goprisma.Introspect(schema)
	assert.NoError(t, err)
	assert.NotEqual(t, "", schema)
	assert.NotEqual(t, "", sdl)

	engine, err := goprisma.NewEngine(schema)
	assert.NoError(t, err)

	defer engine.Close()

	query := `{
            "query": "query Messages {findManymessages(take: 20 orderBy: [{id: desc}]){id message users {id name}}}",
            "variables": {}
        }`

	result, err := engine.Execute(query)
	assert.NoError(t, err)
	assert.NotEqual(t, "", result)
}

func TestIntrospect(t *testing.T) {
	engine := NewEngine(&http.Client{
		Timeout: time.Second * 5,
	})

	parsed, err := url.Parse(queryString)
	assert.NoError(t, err)
	provider := parsed.Scheme
	schema := fmt.Sprintf(`datasource db {
		provider = "%s"
		url      = "%s"
	}`, provider, queryString)

	schema, err = engine.IntrospectPrismaDatabaseSchema(schema)
	assert.NoError(t, err)
	err = engine.StartQueryEngine(schema)
	assert.NoError(t, err)
	defer engine.StopQueryEngine()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	graphQLSchema, err := engine.IntrospectGraphQLSchema(ctx)
	assert.NoError(t, err)
	assert.NotEqual(t, "", graphQLSchema)
	ctx2, cancel2 := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel2()
	res := &bytes.Buffer{}
	err = engine.Request(ctx2, GQLRequest{
		Query:     `query {findManymessages(take: 20 orderBy: [{id: desc}]){id message users {id name}}}`,
		Variables: []byte("{}"),
	}, res)
	assert.NoError(t, err)
	assert.NotEmpty(t, res.Bytes())
	assert.Equal(t, `{"data":{"findManymessages":[{"id":1,"message":"Hey, welcome to the WunderChat! =)","users":{"id":1,"name":"Jens@WunderGraph"}}]}}`, res.String())
}

func TestIntrospectPlanetScale(t *testing.T) {
	engine := NewEngine(&http.Client{
		Timeout: time.Second * 5,
	})

	pscaleURL := "mysql://xxx:pscale_pw_xxx@fwsbiox1njhc.eu-west-3.psdb.cloud/test?sslaccept=strict"

	parsed, err := url.Parse(pscaleURL)
	assert.NoError(t, err)
	provider := parsed.Scheme
	schema := fmt.Sprintf(`datasource db {
		provider = "%s"
		url      = "%s"
		referentialIntegrity = "prisma"
	}

	generator client {
		provider = "prisma-client-js"
		previewFeatures = ["referentialIntegrity"]
	}
`, provider, pscaleURL)

	schema, err = engine.IntrospectPrismaDatabaseSchema(schema)
	assert.NoError(t, err)
	err = engine.StartQueryEngine(schema)
	assert.NoError(t, err)
	defer engine.StopQueryEngine()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	graphQLSchema, err := engine.IntrospectGraphQLSchema(ctx)
	assert.NoError(t, err)
	assert.NotEqual(t, "", graphQLSchema)
	ctx2, cancel2 := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel2()
	res := &bytes.Buffer{}
	err = engine.Request(ctx2, GQLRequest{
		Query:     `query {findManyusers{id email}}`,
		Variables: []byte("{}"),
	}, res)
	assert.NoError(t, err)
	assert.NotEmpty(t, res.Bytes())
	assert.Equal(t, `{"data":{"findManyusers":[]}}`, res.String())
}
