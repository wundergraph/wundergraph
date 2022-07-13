package starwars

import (
	"context"

	"google.golang.org/grpc/metadata"
)

//go:generate protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative starwars.proto
//go:generate protoc --proto_path=./ --descriptor_set_out=starwars.protoset --include_imports starwars.proto

var characters = []*Character{
	{
		Id:              "1",
		Name:            "Luke Skywalker",
		Friends:         nil,
		AppearsIn:       []Episode{Episode_NEWHOPE},
		HomePlanet:      "Earth",
		PrimaryFunction: "jedy",
		Type:            Type_HUMAN,
	},
	{
		Id:              "2",
		Name:            "C-3PO",
		Friends:         nil,
		AppearsIn:       []Episode{Episode_EMPIRE},
		HomePlanet:      "Alderaan",
		PrimaryFunction: "",
		Type:            Type_DROID,
	},
}

type Server struct {
	UnimplementedStarwarsServiceServer
}

func (s *Server) GetHero(ctx context.Context, request *GetHeroRequest) (*Character, error) {
	switch request.Episode {
	case Episode_NEWHOPE:
		return characters[0], nil
	default:
		return characters[1], nil
	}
}

func (s *Server) GetHuman(ctx context.Context, request *GetHumanRequest) (*Character, error) {
	return characters[0], nil
}

func (s *Server) GetDroid(ctx context.Context, request *GetDroidRequest) (*Character, error) {
	md, _ := metadata.FromIncomingContext(ctx)
	token := md.Get("authorization")

	if len(token) > 0 {
		characters[1].PrimaryFunction = token[0]
	}

	return characters[1], nil
}

func (s *Server) ListHumans(ctx context.Context, request *ListEmptyRequest) (*ListHumansResponse, error) {
	return &ListHumansResponse{
		Humans: []*Character{characters[0]},
	}, nil
}

func (s *Server) ListDroids(ctx context.Context, request *ListEmptyRequest) (*ListDroidsResponse, error) {
	return &ListDroidsResponse{
		Droids: []*Character{characters[0]},
	}, nil
}
