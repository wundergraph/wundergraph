---
title: OpenID Connect
pageTitle: WunderGraph - Authentication - OIDC Providers - OpenID Connect
description: Add OpenID Connect authentication to your WunderGraph application.
---

The `openIDConnect` auth provider is a generic provider that can be used with any OpenID Connect compliant identity provider.

## Configuration

Open your project's `wundergraph.config.ts` and scroll down to the `authentication` object.
Inside the nested `cookieBased` object is a nested array object called `providers`.
Inside this array, add an openIDConnect auth provider as shown below:

```typescript {% filename=".wundergraph/wundergraph.config.ts" %}
// ...
authentication: {
  cookieBased: {
    providers: [
      authProviders.openIDConnect({
        id: 'oidc', // you have to choose this ID
        issuer: new EnvironmentVariable('OIDC_ISSUER'),
        clientId: new EnvironmentVariable('OIDC_CLIENT_ID'),
        clientSecret: new EnvironmentVariable('OIDC_CLIENT_SECRET'),
      }),
    ];
  }
}
// ...
```

The `openIDConnect` function takes the following arguments:

- `id`: an unique id that identifies the provider, used to reference the provider in the clients
- `issuer`: the issuer provided by your identity provider
- `clientId`: the client ID provided by your identity provider
- `clientSecret`: the client secret provided by your identity provider

## Production

On production you have to configure cookie keys and crsf token secret to make sure your application is secure, [read more](/docs/wundergraph-config-ts-reference/configure-cookie-based-authentication#important-notes-for-production-use).

## Usage

Once configured you can use the WunderGraph client to authenticate users in your application.

### Login

The `login` function takes the provider id as the first argument and a redirectURL as the second argument.
Calling the `login` function will initiate the authentication flow and redirect the user to the identity provider, after succesful authentication the user will be redirected back to the provided redirectURL or the default redirectURL configured at the provider.

**TypeScript Client**

```typescript
import { createClient } from '.wundergraph/generated/client';

const client = createClient();

client.login('oidc');
```

**Next.js Example**

```tsx {% filename="pages/index.tsx" %}
import { useAuth } from 'components/generated/nextjs';

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
import { useAuth } from 'components/generated/nextjs';

export default function Page() {
  const { logout } = useAuth();

  return <button onClick={() => logout({ logoutOpenidConnectProvider: true })}>Logout</button>;
}
```

### Customize with Hooks

You can customize the authentication flow by using hooks. For example to create a new user in your database after a successful authentication.

```ts {% filename="wundergraph.server.ts" %}
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    authentication: {
      postAuthentication: async ({ user, log }) => {
        log.info(`User ${user.id} has been authenticated`);
      },
    },
  },
}));
```

## Learn more

- [Configuration reference](/docs/wundergraph-config-ts-reference/configure-cookie-based-authentication)
- [TypeScript client reference](/docs/clients-reference/typescript-client)
- [postAuthentication hook reference](/docs/wundergraph-server-ts-reference/post-authentication-hook)
- [mutatingPostAuthentication hook reference](/docs/wundergraph-server-ts-reference/mutating-post-authentication-hook)
