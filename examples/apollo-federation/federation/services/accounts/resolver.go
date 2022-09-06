package accounts

import (
	"context"
	"fmt"
) // THIS CODE IS A STARTING POINT ONLY. IT WILL NOT BE UPDATED WITH SCHEMA CHANGES.

type Resolver struct{}

func (r *Resolver) Entity() EntityResolver {
	return &entityResolver{r}
}
func (r *Resolver) Query() QueryResolver {
	return &queryResolver{r}
}

type entityResolver struct{ *Resolver }

func (r *entityResolver) FindUserByID(ctx context.Context, id string) (*User, error) {
	for _, u := range users {
		if id == u.ID {
			return u, nil
		}
	}
	return nil, fmt.Errorf("not found")
}

type queryResolver struct{ *Resolver }

func (r *queryResolver) Me(ctx context.Context) (*User, error) {
	return users[0], nil
}

var users = []*User{
	{
		ID:       "1",
		Name:     str("Ada Lovelace"),
		Username: str("@ada"),
	},
	{
		ID:       "2",
		Name:     str("Alan Turing"),
		Username: str("@complete"),
	},
}

func str(s string) *string {
	return &s
}
