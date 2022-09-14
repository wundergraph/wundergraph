---
title: Keycloak OpenID Connect Authentication Example
pageTitle: WunderGraph - Examples - Auth0 OpenID Connect Authentication
description:
---

[The Keycloak example](https://github.com/wundergraph/wundergraph/tree/main/examples/keycloak-oidc-authentication)

## Configuration

Let's start by configuring WunderGraph.

```typescript
// wundergraph.config.ts
authentication: {
  cookieBased: {
    providers: [
      authProviders.demo(),
      authProviders.openIdConnect({
        id: 'kc',
        issuer: new EnvironmentVariable('AUTH_ISSUER'),
        clientId: new EnvironmentVariable('AUTH_CLIENT_ID'),
        clientSecret: new EnvironmentVariable('AUTH_CLIENT_SECRET'),
        queryParameters: [{name: "kc_idp_hint", value: "github"}],
      }),
    ],
      authorizedRedirectUris: ['http://localhost:3003'],
  },
}
```

### Get GitHub OAuth app credentials:

1. Go to [GitHub profile settings](https://github.com/settings/developers) and create a new OAuth app.
2. Generate client secret
3. Set authorization callback URL to: `http://localhost:8080/realms/demo/broker/github/endpoint`, and home page URL to: `http://localhost:3000`
4. Copy the `Client ID` and `Client Secret` to the clipboard
5. Rename the `.example.env` file to `.env`
6. Paste the credentials into the `.env` file

### Install & Start

Run keycloak:

```shell
docker compose up -d --wait
```

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

### 3. Use the application

On the NextJS frontend, click the "Login" button.
Once the login is complete, the Frontend will automatically fetch the data and inject the bearer token into the origin request.

### 4. Keycloak console

- `http://localhost:8080/`
- user name: admin
- password: admin
