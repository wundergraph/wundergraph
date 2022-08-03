---
title: Configure Cookie-based authentication
pageTitle: WunderGraph - Configure Cookie-based authentication
description:
---

Cookie-Based Authentication is the best possible authentication flow to be used with a web-based application.
The WunderGraph Server acts as a Token Handler in this case.
The whole flow is handled server-side, on the WunderGraph server,
meaning that an auth code is obtained via the browser but exchanged via the secure back-channel (server-to-server).

Once the Authentication flow is complete,
a secure encrypted cookie is set,
which keeps the user logged in.

## Authentication Providers

WunderGraph relies on OpenID Connect (OIDC) Identity Providers to be able to authenticate users.
Possible providers could be:

- GitHub
- Google
- Auth0
- Okta
- Keycloak
- any other OIDC compatible provider

## Authorized Redirect URIs

The WunderGraph Authentication workflow looks like this.
First, the web Application starts the login flow and redirects the user to the WunderGraph Server (WunderNode).
The WunderNode will then redirect the user to the auth provider.
Once the login flow is successful, the user will be redirected back to the web application.

To make this flow as secure as possible, we have to configure a whitelist of authorized redirect URIs.
These URIs are the only allowed targets to redirect to after a successful authentication flow.
You have to explicitly allow all URIs.

## Configuration

Find below an annotated version of `configureWunderGraphApplication`.

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  authentication: {
    cookieBased: {
      providers: [
        authProviders.demo(), // default auth provider (GitHub demo account, don't use in production)
        authProviders.github({
          id: 'github', // you have to choose this ID
          clientId: 'XXX', // client ID from GitHub
          clientSecret: 'XXX', // client secret from GitHub
        }),
        authProviders.google({
          id: 'google', // you have to choose this ID
          clientId: 'XXX.apps.googleusercontent.com', // client ID from Google
          clientSecret: 'XXX', // client secret from Google
        }),
        authProviders.openIDConnect({
          id: 'auth0', // you have to choose this ID
          clientId: 'XXX', // client ID from Auth0
          clientSecret: 'XXX', // client secret from Auth0
        }),
        authProviders.openIDConnect({
          id: 'okta', // you have to choose this ID
          clientId: 'XXX', // client ID from Okta
          clientSecret: 'XXX', // client secret from Okta
        }),
      ],
      // authorizedRedirectUris are the allowed redirect URIs
      authorizedRedirectUris: [
        // the two URIs below are allowed redirect targets
        'http://localhost:3000/demo',
        'http://localhost:3000/generatedform',
      ],
    },
  },
})
```
