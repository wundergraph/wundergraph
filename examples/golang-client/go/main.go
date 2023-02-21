package main

import (
	"context"
	"fmt"
	"log"

	"client-go/pkg/client"
)

func main() {
	// Create a new client with default options
	wgClient := client.New()
	resp, err := wgClient.Queries().Continents(context.Background())
	if err != nil {
		log.Fatal("Could not request your WunderNode", err)
	}
	// Print the response
	fmt.Println(resp.Data.Countries_continents)
}
