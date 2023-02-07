---
title: Auth0
pageTitle: WunderGraph - Authentication - Auth0
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
      authProviders.openIDConnect({
        id: 'auth0', // you have to choose this ID
        clientId: 'XXX', // client ID from Auth0
        clientSecret: 'XXX', // client secret from Auth0
      }),
    ];
  }
  // ...
}
```

Now create an Auth0 Regular Web Application using the [docs found here](https://auth0.com/docs/get-started/auth0-overview/create-applications).
You must supply an object inside the auth provider that contains 3 properties, two of which come from your new OAuth App:

- `id`: your choice of id
- `clientId`: the client ID from Auth0
- `clientSecret`: the client secret from Auth0

{% callout type="warning" %}
Consider storing your IDs and secrets inside a `.env` file.
{% /callout %}
