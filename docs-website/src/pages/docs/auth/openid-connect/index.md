---
title: OpenID Connect
pageTitle: WunderGraph - Authentication - OpenID Connect
description: Add OpenID Connect authentication to your WunderGraph application.
---

{% callout %}
WunderGraph relies on OpenID Connect (OIDC) Identity Providers to be able to authenticate users.
{% /callout %}

Open your project's `wundergraph.config.ts` and scroll down to the `authentication` object.
Inside the nested `cookieBased` object is a nested array object called `providers`.
Inside this array, add an openIDConnect auth provider as shown below:

```typescript
// wundergraph.config.ts
authentication: {
  cookieBased: {
    providers: [
      authProviders.openIDConnect({
        id: 'auth0', // you have to choose this ID
        clientId: 'XXX', // client ID from OAuth
        clientSecret: 'XXX', // client secret from OAuth
      }),
    ];
  }
  // ...
}
```

Now create a [new OAuth app on GitHub](https://github.com/settings/applications/new).
You must supply an object inside the auth provider that contains 3 properties, two of which come from your new OAuth App:

- `id`: your choice of id
- `clientId`: the client ID from OAuth
- `clientSecret`: the client secret from OAuth

{% callout type="warning" %}
Consider storing your IDs and secrets inside a .env file.
{% /callout %}
