---
title: Authentication Overview
description: An overview of authentication supported by WunderGraph.
---

# Authentication

WunderGraph supports multiple authentication providers out of the box. You can use any combination of authentication providers and even combine them with each other.

## Configuration

```ts
import { WunderGraphConfig } from '@wundergraph/sdk';
import { oidc } from '@wundergraph/sdk/auth';

export default {
  authentication: {
    providers: [
      oidc({
        id: 'oidc',
        issuer: new EnvironmentVariable('OIDC_ISSUER'),
        clientId: new EnvironmentVariable('OIDC_CLIENT_ID'),
        clientSecret: new EnvironmentVariable('OIDC_CLIENT_SECRET'),
      }),
    ],
    /**
     * This is the default redirect URL for all cookie based providers.
     */
    redirectUris: new EnvironmentVariable('REDIRECT_URI_REGEX'),
    /**
     * These secrets are used to sign the authentication cookie and the CSRF token.
     */
    secureCookieHashKey: new EnvironmentVariable('SECURE_COOKIE_HASH_KEY'), // must be of length 32
    secureCookieBlockKey: new EnvironmentVariable('SECURE_COOKIE_BLOCK_KEY'), // must be of length 32
    csrfTokenSecret: new EnvironmentVariable('CSRF_TOKEN_SECRET'), // must be of length 11
  },
  authorization: {
    roles: ['admin', 'user'],
  },
} satisfies WunderGraphConfig;
```

## Usage

### Login

The `login` function takes the provider id as the first argument and a redirectURL as the second argument.
Calling the `login` function will initiate the authentication flow and redirect the user to the identity provider, after succesful authentication the user will be redirected back to the provided redirectURL or the default redirectURL configured at the provider.

**TypeScript Client**

```typescript
import { useAuth } from '../wundergraph/generated/nextjs';

const client = createClient();

client.login('oidc');
```

**Next.js Example**

```tsx
import { useAuth } from '../wundergraph/generated/nextjs';

export default function Page() {
  const { login } = useAuth();

  return <button onClick={() => login('oidc')}>Login with OpenID Connect</button>;
}
```

### Log out

The `logout` method can be used to log out the current user. By default this will only remove the authentication cookie from the browser. If you want to log out the user from the identity provider as well, you can pass the `logoutOpenidConnectProvider` option.

**TypeScript Client**

```typescript
client.logout({
  logoutOpenidConnectProvider: true,
});
```

**Next.js Example**

```tsx {% filename="pages/index.tsx" %}
import { useAuth } from '../wundergraph/generated/nextjs';

export default function Page() {
  const { logout } = useAuth();

  return <button onClick={() => logout({ logoutOpenidConnectProvider: true })}>Logout</button>;
}
```

## Customize with Hooks

You can customize the authentication flow by using hooks. For example to create a new user in your database after a successful authentication.

```ts
export default configureWunderGraphServer(() => ({
  hooks: {
    authentication: {
      postAuthentication: async ({ user, log }) => {
        log.info(`User ${user.id} has been authenticated`);
      },
    },
  },
}));
```

## Authentication timeout

Some temporary data is stored while the user performs the required steps to authenticate. By
default, this temporary data has a timeout of 10 minutes. If needed, this can be increased using
the `timeoutSeconds` field:

```typescript
// ...
authentication: {
  timeoutSeconds: 3600,
}
// ...
```
