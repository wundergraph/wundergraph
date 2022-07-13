package grpc

import (
	"bytes"
	"context"
	"log"
	"net"
	"os"
	"testing"

	"github.com/fullstorydev/grpcurl"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"

	pb "github.com/wundergraph/wundergraph/pkg/datasources/grpc/testdata/starwars"
)

const bufSize = 1024 * 1024

var lis *bufconn.Listener

func TestMain(m *testing.M) {
	lis = bufconn.Listen(bufSize)
	s := grpc.NewServer()
	pb.RegisterStarwarsServiceServer(s, &pb.Server{})
	go func() {
		if err := s.Serve(lis); err != nil {
			log.Fatalf("Server exited with error: %v", err)
		}
	}()

	defer s.Stop()

	os.Exit(m.Run())
}

func bufDialer(context.Context, string) (net.Conn, error) {
	return lis.Dial()
}

func TestSource_Load(t *testing.T) {
	sourceProtoFiles, err := grpcurl.DescriptorSourceFromProtoFiles([]string{"testdata/starwars"}, "starwars.proto")
	require.NoError(t, err)

	conn, err := grpc.DialContext(context.Background(), "bufnet",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithContextDialer(bufDialer),
	)
	require.NoError(t, err)
	defer func() { _ = conn.Close() }()

	src := Source{
		config: EndpointConfiguration{
			Package: "starwars",
			Service: "StarwarsService",
			Method:  "GetHuman",
		},
		descriptorSource: sourceProtoFiles,
		connection:       conn,
	}

	buf := &bytes.Buffer{}

	input := []byte(`{"body":{"id":"1"},"header":{"fizz":["buzz"]}`)
	require.NoError(t, src.Load(context.Background(), input, buf))
	assert.Equal(t, `{"id":"1","name":"Luke Skywalker","appearsIn":["NEWHOPE"],"homePlanet":"Earth","primaryFunction":"jedy"}`, buf.String())
	buf.Reset()

	src.config.Method = "GetDroid"
	input = []byte(`{"body":{"id":"1"},"header":{"authorization":["FFEEBB"]}}`)
	require.NoError(t, src.Load(context.Background(), input, buf))
	assert.Equal(t, `{"id":"2","name":"C-3PO","appearsIn":["EMPIRE"],"homePlanet":"Alderaan","primaryFunction":"FFEEBB","type":"DROID"}`, buf.String())

}
