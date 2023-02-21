---
title: Auth0
pageTitle: WunderGraph - Authentication - OIDC Providers - Auth0
description: Add Auth0 authentication to your WunderGraph application.
---

{% callout %}
WunderGraph relies on OpenID Connect (OIDC) Identity Providers to be able to authenticate users.
{% /callout %}

Open your project's `wundergraph.config.ts` and scroll down to the `authentication` object.
Nested inside this is the `cookieBased` object, in which is a nested array called `providers`.
Inside this array, add an `openIDConnect` auth provider as shown below:

```typescript
// wundergraph.config.ts
authentication: {
  cookieBased: {
    providers: [
      authProviders.auth0({
        id: 'auth0', // you have to choose this ID
        issuer: 'XXX', // issuer from Auth0
        clientId: 'XXX', // client ID from Auth0
        clientSecret: 'XXX', // client secret from Auth0
      }),
    ];
  }
  // ...
}
```

Now create an Auth0 Regular Web Application using the
[docs found here](https://auth0.com/docs/get-started/auth0-overview/create-applications).
You must supply an object inside the auth provider that contains four properties,
three of which come from your new Auth0:

- `id`: your choice of unique id that identifies the provider (used to refer elsewhere to this specific provider)
- `issuer`: the issuer from Auth0
- `clientId`: the client ID from Auth0
- `clientSecret`: the client secret from Auth0

{% callout type="warning" %}
Consider storing your IDs and secrets inside a `.env` file.
{% /callout %}

For a guide on how to configure an Auth0 provider, [see this page](/docs/examples/auth0-openid-connect-authentication).
