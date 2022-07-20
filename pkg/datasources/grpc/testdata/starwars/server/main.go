package main

import (
	"net"

	"google.golang.org/grpc"

	pb "github.com/wundergraph/wundergraph/pkg/datasources/grpc/testdata/starwars"
)

func main() {
	s := grpc.NewServer()
	pb.RegisterStarwarsServiceServer(s, &pb.Server{})

	if l, err := net.Listen("tcp", "127.0.0.1:9095"); err != nil {
		panic(err)
	} else {
		s.Serve(l)
	}
}
