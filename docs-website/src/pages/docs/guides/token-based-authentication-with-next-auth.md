---
title: Token based authentication with NextAuth.js
pageTitle: WunderGraph - Token based authentication with NextAuth.js
description: How to integrate NextAuth.js with WunderGraph
---

Let's say you have an existing Next.js application with NextAuth.js and want to integrate WunderGraph. NextAuth doesn't support OpenID Connect and it would be difficult to migrate all users to another authentication service.
Using token based authentication you can use NextAuth as your authentication service in front of your WunderGraph API.

## Requirements

Before starting you need to have a Next.js application with NextAuth.js installed and configured. If you don't have one, you can follow the [NextAuth.js documentation](https://next-auth.js.org/getting-started/example) to create one.

{% callout %}
Make sure you have enabled the `jwt` session strategy. You can find more information about the `jwt` strategy in the [NextAuth.js documentation](https://next-auth.js.org/configuration/options#session).
{% /callout %}

## Install WunderGraph

Install WunderGraph:

```bash
npm install @wundergraph/sdk @wundergraph/nextjs swr
```

Add the following WunderGraph commands to your package.json

```json
{
  "scripts": {
    "wundergraph": "wunderctl up",
    "generate": "wunderctl generate",
    "build": "npm run generate && npm run build:next",
    "build:next": "next build"
  }
}
```

Create `.wundergraph` folder with the following files:

```
wundergraph.config.ts
wundergraph.operations.ts
wundergraph.server.ts
```

## Configure WunderGraph

### wundergraph.config.ts

Now add the following code to `wundergraph.config.ts`.
We're using our SpaceX test API for the sake of this example, but you could also add your existing database or APIs

```ts
import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

configureWunderGraphApplication({
  apis: [spaceX],
  server,
  operations,
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
    },
    {
      templates: [new NextJsTemplate()],
      path: '../components/generated',
    },
  ],
  cors: {
    ...cors.allowAll,
    allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
  },
  authentication: {
    tokenBased: {
      providers: [
        {
          userInfoEndpoint: 'http://localhost:3000/api/auth/session',
        },
      ],
    },
  },
});
```

Note that we have added the configuration for token based authentication. We are using the `userInfoEndpoint` to fetch the user information from the NextAuth.js session. The `userInfoEndpoint` is called with the `Authorization` header containing the JWT token that we will setup later.

This also assumes that you have installed NextAuth in `pages/api/auth/[...nextauth].ts`, if you use another path you need to adjust the `userInfoEndpoint` accordingly.

### wundergraph.operations.ts

Now add the following code to `wundergraph.operations.ts`.

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

We enabled authentication for all operations.

### wundergraph.server.ts

Now add the following code to `wundergraph.server.ts`.

```ts
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({}));
```

### Add an operation

To test if everything works we need an operation, create `Dragons.graphql` in `.wundergraph/operations` with the following GraphQL query:

```graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

### Next.js client / React hooks

Next we will create our React hooks. Create a new file `wundergraph.ts` in the `lib` folder.

```ts
import { createWunderGraphNext } from '../components/generated/nextjs';

const { client, withWunderGraph, useQuery, useMutation, useSubscription, useFileUpload } = createWunderGraphNext({
  baseURL: 'http://localhost:3000/api/wg',
  ssr: true,
});

export { client, withWunderGraph, useQuery, useMutation, useSubscription, useFileUpload };
```

We create our own WunderGraph client instead of using the auto generated client, because we need to point the baseURL to our Next.js API. In the next step you will see why.

{% callout %}
Note that we don't export `useUser` and `useAuth` here since we use the NextAuth `useSession` hook, `signIn` and `signOut` methods instead.
{% /callout %}

## Configure Next.js

The last step is to make sure we forward the session token to the WunderGraph API. We will do this using Next.js middleware, with the middleware we can add the NextAuth session token to the `Authorization` header and forward it to WunderGraph.

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

## Call the API

All that's left now is to run the query to verify if everything is working correctly.

Add the following code to a page, for example `pages/index.tsx`.

```tsx
import { signIn, signOut, useSession } from 'next-auth/react';
import { useQuery } from '../lib/wundergraph';

export default function Home() {
  const { data: session } = useSession();

  const { data, isLoading, error } = useQuery({
    operationName: 'Dragons',
    enabled: !!session, // only run the query once we are logged in
  });

  if (!session) {
    return (
      <div>
        <p>You are not signed in</p>
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {data?.spacex_dragons.map((dragon) => (
        <div key={dragon.name}>
          <h2>{dragon.name}</h2>
          <p>Active: {dragon.active ? 'Yes' : 'No'}</p>
        </div>
      ))}
    </div>
  );
}
```

Start Next.js in development mode:

```bash
npm run next dev
```

Run WunderGraph:

```bash
npm run wundergraph
```

Now you can run the application and log in using the NextAuth.js login page. After you are logged in you should see the list of SpaceX dragons. 👏

## What's next?

We now have a basic setup that works on localhost. In order to run this on production you should configure environment variables for all endpoints used in this example.

## Conclusion

In this guide we have shown you how to use WunderGraph with NextAuth.js. We have added WunderGraph to an existing Next.js application and use NextAuth as the authentication provider in front of our WunderGraph API.

The technique we used to forward the NextAuth session token to WunderGraph can be used to forward any kind of authentication token to WunderGraph. This can be useful if you want to use WunderGraph with other authentication providers that don't support OIDC. For example Gotrue (Netlify Auth), Supabase Auth, or any other hosted authentication service that supports JSON Web Tokens.

## Resources

- [NextAuth Documentation](https://next-auth.js.org/getting-started/introduction)
