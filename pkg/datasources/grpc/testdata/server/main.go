package main

import (
	"context"
	"log"
	"net"

	"google.golang.org/grpc"

	pb "github.com/wundergraph/wundergraph/pkg/datasources/grpc/testdata/starwars"
)

func main() {
	lis, err := net.Listen("tcp", "127.0.0.1:9095")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer(grpc.UnaryInterceptor(Interceptor))
	pb.RegisterStarwarsServiceServer(s, &pb.Server{})

	log.Printf("server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}

}

func Interceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	log.Println("Method:", info.FullMethod, "Request Payload:", req)
	defer func() { log.Println("Method:", info.FullMethod, "Response Payload:", resp) }()

	return handler(ctx, req)
}
