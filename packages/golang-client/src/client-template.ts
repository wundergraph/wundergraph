export const clientTemplate = `
import (
	"context"
	"net/http"

	"github.com/wundergraph/client-go/pkg/execute"
)

type Client struct {
	httpClient  *http.Client
	baseURL string
}

func New(httpClient *http.Client, baseURL string) *Client {
	return &Client{httpClient, baseURL}
}

func (c *Client) Queries() *Queries {
	return &Queries{c}
}

func (c *Client) Mutations() *Mutations {
	return &Mutations{c}
}

func (c *Client) Subscriptions() *Subscriptions {
	return &Subscriptions{c}
}

func (c *Client) LiveQueries() *LiveQueries {
	return &LiveQueries{c}
}

type Queries struct {
	client *Client
}

{{#each queries }}
func (q *Queries) {{name}}(ctx context.Context{{#if hasInput}}, input {{name}}Input{{/if}}) (*{{name}}Response, error) {
	return execute.Query[{{#if hasInput}}{{name}}Input{{else}}any{{/if}}, {{name}}Response](q.client.httpClient, ctx, q.client.baseURL, "/{{name}}", {{#if hasInput}}&input{{else}}nil{{/if}})
}
{{/each}}

type LiveQueries struct {
	client *Client
}

{{#each queries}}
func (l *LiveQueries) {{name}}(ctx context.Context{{#if hasInput}}, input {{name}}Input{{/if}}) (*execute.Stream[{{name}}Response], error) {
	return execute.LiveQuery[{{#if hasInput}}{{name}}Input{{else}}any{{/if}}, {{name}}Response](l.client.httpClient, ctx, l.client.baseURL, "/{{name}}", {{#if hasInput}}&input{{else}}nil{{/if}})
}
{{/each}}

type Mutations struct {
	client *Client
}

{{#each mutations}}
func (m *Mutations) {{name}}(ctx context.Context{{#if hasInput}}, input {{name}}Input{{/if}}) (*{{name}}Response, error) {
	return execute.Mutate[{{#if hasInput}}{{name}}Input{{else}}any{{/if}}, {{name}}Response](m.client.httpClient, ctx, m.client.baseURL, "/{{name}}", {{#if hasInput}}&input{{else}}nil{{/if}})
}
{{/each}}

type Subscriptions struct {
	client *Client
}

{{#each subscriptions}}
func (s *Subscriptions) {{name}}(ctx context.Context{{#if hasInput}}, input {{name}}Input{{/if}}) (*execute.Stream[{{name}}Response], error) {
	return execute.Subscribe[{{#if hasInput}}{{name}}Input{{else}}any{{/if}}, {{name}}Response](s.client.httpClient, ctx, s.client.baseURL, "/{{name}}", {{#if hasInput}}&input{{else}}nil{{/if}})
}
{{/each}}
`;
