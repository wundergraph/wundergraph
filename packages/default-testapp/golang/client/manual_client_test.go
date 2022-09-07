package client

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestQueries_Missions(t *testing.T) {
	client := &Client{
		baseURL:    "http://localhost:9991/app/main/operations",
		httpClient: &http.Client{},
	}
	res, err := client.Queries().Weather(context.Background(), WeatherInput{
		Code: "DE",
	})
	assert.NoError(t, err)

	// pretty print res as json
	b, err := json.MarshalIndent(res, "", "  ")
	assert.NoError(t, err)
	t.Log(string(b))
}

func TestQueries_SetField(t *testing.T) {
	client := &Client{
		baseURL:    "http://localhost:9991/app/main/operations",
		httpClient: &http.Client{},
	}
	res, err := client.Mutations().SetField(context.Background(), SetFieldInput{
		Sdl: "Jannik",
	})
	assert.NoError(t, err)

	// pretty print res as json
	b, err := json.MarshalIndent(res, "", "  ")
	assert.NoError(t, err)
	t.Log(string(b))
}

func TestQueries_Weather(t *testing.T) {
	client := &Client{
		baseURL:    "http://localhost:9991/app/main/operations",
		httpClient: &http.Client{},
	}
	res, err := client.Queries().Weather(context.Background(), WeatherInput{
		Code: "DE",
	})
	assert.NoError(t, err)

	// pretty print res as json
	b, err := json.MarshalIndent(res, "", "  ")
	assert.NoError(t, err)
	t.Log(string(b))
}

func TestLiveQueries_Weather(t *testing.T) {
	client := &Client{
		baseURL:    "http://localhost:9991/app/main/operations",
		httpClient: &http.Client{},
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	stream, err := client.LiveQueries().Weather(ctx, WeatherInput{
		Code: "DE",
	})
	assert.NoError(t, err)
	defer stream.Close()

	for {
		res, closed, err := stream.Next(ctx)
		assert.NoError(t, err)
		if closed {
			break
		}
		// pretty print res as json
		b, err := json.MarshalIndent(res, "", "  ")
		assert.NoError(t, err)
		t.Log(string(b))
	}
}

func TestSubscriptions_UpdatedPrice(t *testing.T) {
	client := &Client{
		baseURL:    "http://localhost:9991/app/main/operations",
		httpClient: &http.Client{},
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	stream, err := client.Subscriptions().PriceUpdates(ctx)
	assert.NoError(t, err)
	defer stream.Close()

	for {
		res, closed, err := stream.Next(ctx)
		assert.NoError(t, err)
		if closed {
			break
		}
		// pretty print res as json
		b, err := json.MarshalIndent(res, "", "  ")
		assert.NoError(t, err)
		t.Log(string(b))
	}
}
