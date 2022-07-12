package reviews

import (
	"context"
	"fmt"
) // THIS CODE IS A STARTING POINT ONLY. IT WILL NOT BE UPDATED WITH SCHEMA CHANGES.

type Resolver struct{}

func (r *Resolver) Entity() EntityResolver {
	return &entityResolver{r}
}

type entityResolver struct{ *Resolver }

func (r *entityResolver) FindUserByID(ctx context.Context, id string) (*User, error) {
	u := &User{ID: id}
	for _, user := range usernames {
		if id == user.ID {
			u.Username = user.Username
		}
	}
	for _, r := range reviews {
		if r.Author.ID == id {
			u.Reviews = append(u.Reviews, r)
		}
	}
	return u, nil
}

func (r *entityResolver) FindProductByUpc(ctx context.Context, upc string) (*Product, error) {
	p := &Product{Upc: upc}
	for _, r := range reviews {
		if r.Product.Upc == upc {
			p.Reviews = append(p.Reviews, r)
		}
	}
	return p, nil
}

func (r *entityResolver) FindReviewByID(ctx context.Context, id string) (*Review, error) {
	for _, r := range reviews {
		if r.ID == id {
			return r, nil
		}
	}
	return nil, fmt.Errorf("not found")
}

var reviews = []*Review{
	{
		ID:      "1",
		Body:    str("Love it!"),
		Author:  &User{ID: "1", Username: str("@ada")},
		Product: &Product{Upc: "1"},
	},
	{
		ID:      "2",
		Author:  &User{ID: "1", Username: str("@ada")},
		Product: &Product{Upc: "2"},
		Body:    str("Too expensive."),
	},
	{
		ID:      "3",
		Author:  &User{ID: "2", Username: str("@complete")},
		Product: &Product{Upc: "3"},
		Body:    str("Could be better."),
	},
	{
		ID:      "4",
		Author:  &User{ID: "2", Username: str("@complete")},
		Product: &Product{Upc: "1"},
		Body:    str("Prefer something else."),
	},
}

var usernames = []*User{
	{ID: "1", Username: str("@ada")},
	{ID: "2", Username: str("@complete")},
}

func str(s string) *string {
	return &s
}
