package commands

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/wundergraph/wundergraph/cli/commands/sdkArgs"
	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
)

const (
	Mysql       = "mysql"
	Planetscale = "planetscale"
	Postgres    = "postgres"
	Sqlite      = "sqlite"
	SqlServer   = "sqlServer"
	Mongodb     = "mongodb"
	OpenAPI     = "openApi"
	Graphql     = "graphql"
	querySchema = "query IntrospectionQuery { __schema {  queryType { name } mutationType { name } subscriptionType { name } types { ...FullType } directives { name description  locations args { ...InputValue } } } }  fragment FullType on __Type { kind name description  fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason } inputFields { ...InputValue } interfaces { ...TypeRef } enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason } possibleTypes { ...TypeRef } }  fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue   }  fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } } }"
)

type _c struct {
}

func NewClient() API {
	return &_c{}
}

func (c *_c) Execute(command sdkArgs.CommandType, opts ...sdkArgs.Option) error {
	os.Args = []string{"#", string(command)}
	for _, opt := range opts {
		os.Args = append(os.Args, opt.ConvertToArgs()...)
	}
	ss := os.Args
	fmt.Println(ss)
	return rootCmd.Execute()
}

func (c *_c) NodeState() bool {
	if SdkNode.Node == nil {
		return false
	}
	return SdkNode.Node.State()
}

func (c *_c) Stop() error {
	if configRunnerSdk != nil {
		configRunnerSdk.Stop()
	}
	if configIntrospectionRunnerSdk != nil {
		configRunnerSdk.Stop()
	}
	if hookServerRunnerSdk != nil {
		configRunnerSdk.Stop()
	}
	if SdkNode.Node != nil {
		err := SdkNode.Node.Close()
		SdkNode.Node = nil
		fmt.Println(err)
	}

	return nil
}

func (c *_c) CheckIntrospect(dbType, databaseURL string) (err error) {
	switch dbType {
	case Mysql:
		return checkMysql(databaseURL)
	case Planetscale:
		return checkPlanetscale(databaseURL)
	case Postgres:
		return checkPostgres(databaseURL)
	case Sqlite:
		return checkSqlite(databaseURL)
	case SqlServer:
		return checkSqlServer(databaseURL)
	case Mongodb:
		return checkMongodb(databaseURL)
	case Graphql:
		return checkGraphql(databaseURL)
	case OpenAPI:
		return checkOpenApi(databaseURL)
	}
	//rest
	//GraphQL
	return
}

func checkMysql(databaseURL string) (err error) {
	introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "mysql"
			url      = "%s"
		}`, databaseURL)
	_, _, _, err = database.IntrospectPrismaDatabase(introspectionSchema, log)
	return
}

func checkPlanetscale(databaseURL string) (err error) {
	parsed, err := url.Parse(databaseURL)
	if err != nil {
		return errors.New("invalid database url")
	}

	query := parsed.Query()
	query.Set("sslaccept", "strict")
	parsed.RawQuery = query.Encode()
	introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "mysql"
			url      = "%s"
		}`, parsed.String())
	_, _, _, err = database.IntrospectPrismaDatabase(introspectionSchema, log)
	return
}

func checkPostgres(databaseURL string) (err error) {
	introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "postgresql"
			url      = "%s"
		}`, databaseURL)

	_, _, _, err = database.IntrospectPrismaDatabase(introspectionSchema, log)
	return
}

func checkSqlite(databaseURL string) (err error) {
	introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "sqlite"
			url      = "%s"
		}`, databaseURL)
	_, _, _, err = database.IntrospectPrismaDatabase(introspectionSchema, log)
	return
}

func checkSqlServer(databaseURL string) (err error) {
	introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "sqlserver"
			url      = "%s"
		}`, databaseURL)
	_, _, _, err = database.IntrospectPrismaDatabase(introspectionSchema, log)
	return
}

func checkMongodb(databaseURL string) (err error) {
	introspectionSchema := fmt.Sprintf(`datasource db {
  provider = "mongodb"
  url      = "%s"
}
`, databaseURL)
	_, _, _, err = database.IntrospectPrismaDatabase(introspectionSchema, log)
	return
}

func checkGraphql(databaseURL string) (err error) {
	paramMap := map[string]string{
		"operationName": "IntrospectionQuery",
		"query":         querySchema,
	}
	return DoPost(databaseURL, paramMap)
}

func checkOpenApi(databaseURL string) (err error) {

	return nil
}

func DoPost(urls string, paramMap map[string]string) (err error) {
	client := &http.Client{}

	param, _ := json.Marshal(paramMap)
	req, err := http.NewRequest("POST", urls, bytes.NewBuffer(param))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	content, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	result := struct {
		Data  interface{} `json:"data"`
		Error interface{} `json:"error"`
	}{}
	err = json.Unmarshal(content, &result)
	if err != nil {
		return
	}
	if result.Error != nil {
		return
	}
	return nil
}
