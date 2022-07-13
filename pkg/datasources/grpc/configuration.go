package grpc

import (
	"bytes"
	"encoding/json"
	"net/http"
)

var (
	dot   = []byte(".")
	slash = []byte("/")
)

type Configuration struct {
	Server   ServerConfiguration
	Endpoint EndpointConfiguration
	Request  RequestConfiguration
}

type ServerConfiguration struct {
	Protoset []byte
	Target   string
}

type EndpointConfiguration struct {
	Package string
	Service string
	Method  string
}

type RequestConfiguration struct {
	Header http.Header
	Body   string
}

func ConfigJson(config Configuration) json.RawMessage {
	out, _ := json.Marshal(config)
	return out
}

func (c EndpointConfiguration) RpcMethodFullName() string {
	buf := &bytes.Buffer{}
	buf.WriteString(c.Package)
	buf.Write(dot)
	buf.WriteString(c.Service)
	buf.Write(slash)
	buf.WriteString(c.Method)

	return buf.String()
}
