package authentication

import "context"

// Hooks represents the interface for the available authentication hooks
type Hooks interface {
	// PostAuthentication runs after authentication and doesn't mutate the user
	PostAuthentication(ctx context.Context, user *User) error
	// MutatingPostAuthentication runs after PostAuthentication and might mutate the user
	MutatingPostAuthentication(ctx context.Context, user *User) (*User, error)
	// PostLogout runs after logout and doesn't mutate the user
	PostLogout(ctx context.Context, user *User) error
	// RevalidateAuthentication is used when an API client request the
	// authenticated user to be revalidated. It might mutate the user
	RevalidateAuthentication(ctx context.Context, user *User) (*User, error)
}
