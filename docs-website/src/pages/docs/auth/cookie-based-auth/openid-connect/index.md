---
title: OpenID Connect
pageTitle: WunderGraph - Authentication - OIDC Providers - OpenID Connect
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
        id: 'oidc', // you have to choose this ID
        issuer: 'XXX',
        clientId: 'XXX',
        clientSecret: 'XXX',
      }),
    ];
  }
  // ...
}
```

You must supply an object inside the auth provider that contains four properties,
three of which come from your identity provider.

- `id`: your choice of unique id that identifies the provider (used to refer elsewhere to this specific provider)
- `issuer`: the issuer provided by your identity provider
- `clientId`: the client ID provided by your identity provider
- `clientSecret`: the client secret provided by your identity provider

{% callout type="warning" %}
Consider storing your IDs and secrets inside a `.env` file.
{% /callout %}
