package authentication

import "context"

type Hooks interface {
	PostAuthentication(ctx context.Context, user *User) error
	MutatingPostAuthentication(ctx context.Context, user *User) (*User, error)
	PostLogout(ctx context.Context, user *User) error
	RevalidateAuthentication(ctx context.Context, user *User) (*User, error)
}
