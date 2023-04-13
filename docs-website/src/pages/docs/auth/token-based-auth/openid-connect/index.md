---
title: OpenID Connect
pageTitle: WunderGraph - Authentication - Token-based Auth - OpenId Connect
description: Add token-based authentication with OpenId Connect to your WunderGraph application.
---

Token-Based Authentication is very flexible and gives you a lot of different ways of authenticating clients against your WunderGraph applications.
This way, you're able to use WunderGraph with code- or device flows.
The responsibility to obtain an access token in this scenario is on the client itself.

## Configuration

Configuring token-based Authentication is straight forward.
You can set the `jwksURL` or `jwksJSON` in the token-based authentication configuration.

```typescript
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          jwksURL: 'https://wundergraph.fusionauth.io/.well-known/jwks.json',
        },
      ],
    },
  },
});
```

The WunderGraph Server will use a JSON Web Key Set from your OpenID Connect Server to validate the token,
in case of a JWT.

If the token is opaque (just a reference), the JWKS step will be skipped and the `userInfoEndpoint` is required. The user info endpoint allows the server to obtain all available claims from the user,
e.g. their username and email, which are then stored within the WunderGraph user Identity.

```typescript
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          jwksURL: 'https://wundergraph.fusionauth.io/.well-known/jwks.json',
          userInfoEndpoint: 'https://wundergraph.fusionauth.io/oauth2/userinfo',
        },
      ],
    },
  },
});
```

## Usage

Using token based Authentication with WunderGraph follows a simple principle.
Your client obtains a token any way they want.
They then set the token as the Authorization Header.

```ts
const headers = {
  Authorization: `Bearer ${TOKEN}`,
};
```

**TypeScript client**

Use the `setAuthorizationToken` method of the client to set the token.

```typescript
client.setAuthorizationToken(token);

client.query({
  operationName: 'AuthenticatedQuery',
});
```

**Next.js**

When using the WunderGraph Next.js integration, you can set the token using the `useAuthMiddlware` hook. This will inject the token into the client headers. You can retrieve the token asynchroniously from your auth client.

```tsx {% filename="_app.tsx" %}
import { Middleware } from 'swr';
import { useAuthMiddleware } from '@wundergraph/nextjs';
import { withWunderGraph } from '../components/generated/nextjs';
import { getToken } from 'your/auth/client';

const useAuthToken: Middleware = (useSWRNext) => {
  return useAuthMiddleware(useSWRNext, async () => {
    return await getToken();
  });
};

function MyApp() {
  return <div>My App</div>;
}

export default withWunderGraph(MyApp, {
  use: [useAuthToken],
});
```

## Learn more

- [Token-based Authentication reference](/docs/wundergraph-config-ts-reference/configure-token-based-authentication)
- [Client reference](/docs/clients-reference/typescript-client)
