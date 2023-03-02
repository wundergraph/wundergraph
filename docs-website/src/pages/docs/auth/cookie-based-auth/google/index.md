---
title: Google
pageTitle: WunderGraph - Authentication - OIDC Providers - Google
description: Add Google authentication to your WunderGraph application.
---

{% callout %}
WunderGraph relies on OpenID Connect (OIDC) Identity Providers to be able to authenticate users.
{% /callout %}

Open your project's `wundergraph.config.ts` and scroll down to the `authentication` object.
Inside the nested `cookieBased` object is a nested array object called `providers`.
Inside this array, add an google auth provider as shown below:

```typescript
// wundergraph.config.ts
authentication: {
  cookieBased: {
    providers: [
      authProviders.google({
        id: 'google', // you have to choose this ID
        clientId: '.apps.googleusercontent.com', // client ID from Google
        clientSecret: 'XXX', // client secret from Google
      }),
    ];
  }
  // ...
}
```

Now create a OAuth app through Google:

1. Go to the [Credentials page](https://console.developers.google.com/apis/credentials).
2. Click **Create credentials** > **OAuth client ID**.
3. Select the **Web application** application type.
4. Name your OAuth 2.0 client and click **Create**.

For more help, see [Google's developer docs](https://developers.google.com/identity/sign-in/web/sign-in).

You must supply an object inside the auth provider that contains three properties,
two of which come from your new Google OAuth App:

- `id`: your choice of unique id that identifies the provider (used to refer elsewhere to this specific provider)
- `clientId`: the client ID from Google
- `clientSecret`: the client secret from Google

{% callout type="warning" %}
Consider storing your IDs and secrets inside a `.env` file.
{% /callout %}
