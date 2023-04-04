---
title: Next.js + Clerk Example
pageTitle: WunderGraph - Examples - Next.js - Clerk
description: An example that demonstrates how to integrate WunderGraph with Next.js and Clerk
---

[The NextJS + Clerk example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-clerk) demonstrates how you can use Clerk as your authentication provider with WunderGraph.

This example uses Clerk JWT Templates, Next.js middleware, and the WunderGraph Next.js client.

## Installation

The quickest way to get started is by using create-wundergraph-app.

```bash
npx create-wundergraph-app --example nextjs-clerk
```

## Configuration

### Clerk API keys

First, you need to create a Clerk application and configure the Clerk API keys in your `.env.local` file.

1. Go to [Clerk](https://clerk.com/) and create a new application or use an existing one.
2. On your application dashboard to to `API Key`
3. Use the `Quick Copy` for Next.js and copy the `.env.local`
4. Create a new `.env.local` file in the root folder (next to the `package.json`)
5. Paste the credentials into the `.env.local` file

### Clerk JWT Templates

1. Go to `JWT Templates` and create a new `Blank` template
2. Name it `wundergraph`
3. Use the following template: (You can also include other claims as needed)

```json
{
  "id": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "lastName": "{{user.last_name}}",
  "username": "{{user.username}}",
  "firstName": "{{user.first_name}}"
}
```

4. Copy the JWKS Endpoint url
5. Add a new environment variable to `.env.local` called `CLERK_JWKS_URL` and paste the url as the value

### Run the app

Running `npm start` will start WunderGraph and Next.js in development mode.

```bash
npm start
```

Head over to `http://localhost:3000` in your browser to see the integration in action.

Clicking the `Login` button will redirect you to the Clerk login page. After logging in, you will be redirected back to the app and you will see the result of the Countries operation and the user claims.

## Learn more

- [Clerk documentation](https://clerk.com/docs)
- [Next.js client documentation](/docs/clients-reference/nextjs)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs-clerk" /%}
