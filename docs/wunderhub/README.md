# WunderHub

[WunderHub](https://hub.wundergraph.com/) is "The package manager for API's". Share and integrate your API's with only a few clicks.

## Development

### Login for local development

```sh
WUNDERGRAPH_OAUTH_CLIENT_ID=wundergraph-local-cli \
WUNDERGRAPH_OAUTH_BASE_URL=https://accounts.wundergraph.com/auth/realms/testing \
WUNDERGRAPH_API_URL=https://api.wundergraph.local wunderctl login --debug
```