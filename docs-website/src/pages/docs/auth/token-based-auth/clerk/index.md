---
title: Token based authentication with Clerk
pageTitle: WunderGraph - Token based authentication with Clerk
description: Add Clerk authentication to your WunderGraph application.
---

This guide will show you how to use Clerk as your authentication provider in an existing Next.js + WunderGraph application.

## Configure Clerk

1. Go to [Clerk](https://clerk.com/) and create a new application or use an existing one.
2. On your application dashboard to to `API Key`
3. Use the `Quick Copy` for Next.js and copy the `.env.local`
4. Create a new `.env.local` file in the root folder (next to the `package.json`)
5. Paste the credentials into the `.env.local` file
6. Go to `JWT Templates` and create a new `Blank` template
7. Name it `wundergraph`
8. Use the following template: (You can also include other claims as needed)

```json
{
  "id": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "lastName": "{{user.last_name}}",
  "username": "{{user.username}}",
  "firstName": "{{user.first_name}}"
}
```

9. Copy the JWKS Endpoint url

## Configure WunderGraph

Open `wundergraph.config.ts` and add a new token-based authentication provider:

```ts {% filename="wundergraph.config.ts" %}
// ...
authentication: {
    tokenBased: {
        providers: [
            {
                jwksURL: 'https://your-clerk-subdomain.clerk.accounts.dev/.well-known/jwks.json',
            },
        ],
    },
},
// ...
```

## Configure Next.js

Open `pages/_app.tsx` and add the `useWunderGraphClerk` middleware to the `withWunderGraph` call:

```tsx {% filename="pages/_app.tsx" %}
import { Middleware } from 'swr';
import { useAuth } from '@clerk/nextjs';
import { useAuthMiddleware } from '@wundergraph/nextjs';
import { withWunderGraph } from '../components/generated/nextjs';

export const useWunderGraphClerk: Middleware = (useSWRNext) => {
  const auth = useAuth();

  return useAuthMiddleware(useSWRNext, async () => {
    return auth.getToken({ template: 'wundergraph' });
  });
};

const App = () => {
  // ...
};

export default withWunderGraph(App, {
  use: [useWunderGraphClerk],
});
```

That's it! Your WunderGraph application is now protected by Clerk.

## Learn More

- [WunderGraph Docs](https://docs.wundergraph.com/docs/auth/token-based-auth/clerk).
- [Clerk Docs](https://clerk.com/docs)
