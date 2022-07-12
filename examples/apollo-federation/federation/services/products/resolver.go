package products

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
) // THIS CODE IS A STARTING POINT ONLY. IT WILL NOT BE UPDATED WITH SCHEMA CHANGES.

type Resolver struct{}

func (r *Resolver) Query() QueryResolver {
	return &queryResolver{r}
}

func (r *Resolver) Mutation() MutationResolver {
	return &mutationResolver{r}
}

func (r *Resolver) Entity() EntityResolver {
	return &entityResolver{r}
}

func (r *Resolver) Subscription() SubscriptionResolver {
	return &subscriptionResolver{r}
}

type entityResolver struct{ *Resolver }

func (r *entityResolver) FindProductByUpc(ctx context.Context, upc string) (*Product, error) {
	for _, p := range products {
		if p.Upc == upc {
			return p, nil
		}
	}
	return nil, fmt.Errorf("not found")
}

type queryResolver struct{ *Resolver }

func (r *queryResolver) TopProducts(ctx context.Context, first *int, random *bool) ([]*Product, error) {
	if first == nil || *first > len(products) {
		first = num(len(products))
	}
	if random != nil && *random {
		productsMux.Lock()
		defer productsMux.Unlock()
		for _, product := range products {
			min := 10
			max := 1499
			product.Price = num(rand.Intn(max-min+1) + min)
		}
	}
	return products[0:*first], nil
}

type subscriptionResolver struct{ *Resolver }

func (s *subscriptionResolver) UpdatedPrice(ctx context.Context) (<-chan *Product, error) {
	updatedPrice := make(chan *Product)
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			default:
				rand.Seed(time.Now().UnixNano())
				product := products[rand.Intn(len(products)-1)]
				min := 10
				max := 1499
				product.Price = num(rand.Intn(max-min+1) + min)
				updatedPrice <- product
				time.Sleep(time.Second * 1)
			}
		}
	}()
	return updatedPrice, nil
}

type mutationResolver struct{ *Resolver }

func (m mutationResolver) SetPrice(ctx context.Context, upc string, price int) (*Product, error) {
	for i := range products {
		if products[i].Upc == upc {
			productsMux.Lock()
			defer productsMux.Unlock()
			products[i].Price = num(price)
			return products[i], nil
		}
	}
	return nil, fmt.Errorf("product not found")
}

var productsMux sync.Mutex

var products = []*Product{
	{
		Upc:    "1",
		Name:   str("Table"),
		Price:  num(899),
		Weight: num(100),
	},
	{
		Upc:    "2",
		Name:   str("Couch"),
		Price:  num(1299),
		Weight: num(1000),
	},
	{
		Upc:    "3",
		Name:   str("Chair"),
		Price:  num(54),
		Weight: num(50),
	},
}

func str(s string) *string { return &s }

func num(i int) *int { return &i }
