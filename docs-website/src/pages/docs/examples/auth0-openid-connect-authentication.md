---
title: Auth0 OpenID Connect Authentication Example
pageTitle: WunderGraph - Examples - Auth0 OpenID Connect Authentication
description:
---

WunderGraph supports OpenID Connect as authentication mechanism.
Auth0 is a popular and easy to use OpenID Connect provider.

This example shows how to use Auth0 and WunderGraph together.

## Setup

First, let's set up the project from a template:

```bash
npx create-wundergraph-app my-project -E auth0-oidc-authentication
cd my-project
npm install
```

## Configure Auth0

1. Go to Auth0 and create a new application of type "Regular Web Application"
1. Skip the Quickstart
1. Copy the Issuer, Client ID and Client Secret to the clipboard
1. Rename the .example.env file to .env
1. Paste the credentials into the .env file
1. Set the Callback URL on Auth0 to `http://localhost:9991/auth/cookie/callback/auth0`

## Start the project

```bash
npm run start
```

That's it! Next, you can check out the `pages/index.tsx` to see how the integration works.

## Learn more

- [Auth0](https://auth0.com/)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="auth0-oidc-authentication" /%}
