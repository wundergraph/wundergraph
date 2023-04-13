---
title: Token based authentication with Auth.js
pageTitle: WunderGraph - Token based authentication with Auth.js
description: Add Auth.js (NextAuth) authentication to your WunderGraph application.
---

This guide will show you how to enable token based authentication with Auth.js (NextAuth) in an existing Next.js + WunderGraph application.

## Requirements

Before starting you need to have a Next.js application with NextAuth.js installed and configured. If you don't have one, you can follow the [NextAuth.js documentation](https://next-auth.js.org/getting-started/example) to create one.

{% callout %}
Make sure you have enabled the `jwt` session strategy. You can find more information about the `jwt` strategy in the [NextAuth.js documentation](https://next-auth.js.org/configuration/options#session).
{% /callout %}

## Configure WunderGraph

### wundergraph.config.ts

Add a token-based authentication provider to your `wundergraph.config.ts` file and configure the `userInfoEndpoint` to fetch the user information from the NextAuth.js session. This will point to an Next.js api route that we will create later.

```ts {% filename="wundergraph.config.ts" %}
// ...
authentication: {
    tokenBased: {
        providers: [
            {
                userInfoEndpoint: 'http://localhost:3000/api/auth/session',
            },
        ],
    },
},
// ...
```

Note that we have added the configuration for token based authentication. We are using the `userInfoEndpoint` to fetch the user information from the NextAuth.js session. The `userInfoEndpoint` is called with the `Authorization` header containing the JWT token that we will setup later.

This also assumes that you have installed NextAuth in `pages/api/auth/[...nextauth].ts`, if you use another path you need to adjust the `userInfoEndpoint` accordingly.

### wundergraph.operations.ts

Next, we can enable authentication for all operations.

```ts
import { configureWunderGraphOperations } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';

export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    defaultConfig: {
      authentication: {
        required: true,
      },
    },
  },
});
```

## Configure Next.js with middleware

The last step is to make sure we forward the session token to the WunderGraph API. We will do this using Next.js middleware, with the middleware we can add the NextAuth session token to the `Authorization` header and forward it to WunderGraph.

{% callout %}
If you don't want to use Next.js middleware you can also use the `useAuthMiddleware` hook to inject the token into the `Authorization` header. Continue reading in the next step.
{% /callout %}

Create `middelware.ts` in the root of your Next.js application.

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// the middleware will run for all requests that match this pattern,
// we don't actually need to define an api route for this.
export const config = {
  matcher: '/api/wg/:function*',
};

export function middleware(request: NextRequest) {
  // retrieve the session token from the cookie
  const token = request.cookies.get('next-auth.session-token')?.value;

  let pathname = request.nextUrl.pathname.replace('/api/wg', '');

  // rewrite the api url to the WunderGraph API
  const url = new URL(pathname + request.nextUrl.search, 'http://127.0.0.1:9991');

  // add the token to the Authorization header
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });

  // rewrite the request to the WunderGraph API
  const response = NextResponse.rewrite(url, {
    request: {
      headers,
    },
  });

  return response;
}
```

What happens now is that all requests to `http://localhost:3000/api/wg/*` will be rewritten to our WunderGraph API at `http://127.0.0.1:9991/api/*` with the NextAuth session token added to the `Authorization` header.

WunderGraph will add the `Authorization` header to the userInfoEndpoint request which will return the user information if the token is valid and the request will be authenticated.

## Configure Next.js useAuthMiddleware

If you don't want to use middleware you can also use the `useAuthMiddleware` middleware to inject the token into the `Authorization` header.

```tsx {% filename="_app.tsx" %}
import { Middleware } from 'swr';
import { useAuthMiddleware } from '@wundergraph/nextjs';
import { withWunderGraph } from '../components/generated/nextjs';
import { getToken } from 'next-auth/jwt';

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

## Resources

- [NextAuth Documentation](https://next-auth.js.org/getting-started/introduction)
- [Auth.js Documentation](https://authjs.dev/getting-started/introduction)
- [Token-based Auth Reference](/docs/wundergraph-config-ts-reference/configure-token-based-authentication)
