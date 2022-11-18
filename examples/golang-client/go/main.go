package main

import (
	"client-go/pkg/client"
	"context"
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Create a new client
	httpClient := &http.Client{}
	wgClient := client.New(httpClient, "http://localhost:9991/operations")
	resp, err := wgClient.Queries().Continents(context.Background())
	if err != nil {
		log.Fatal("Could not request your WunderNode", err)
	}
	// Print the response
	fmt.Println(resp.Data.Countries_continents)
}
