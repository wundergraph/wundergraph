---
title: Quickstart
pageTitle: WunderGraph - Getting started quickly with WunderGraph
description: Initialize your WunderGraph development environment and get started using WunderGraph
---

This quick start guide will help you to start a new WunderGraph project from scratch, or add WunderGraph to an existing project.

## Creating a new WunderGraph project

```shell
# Init a new project
npx create-wundergraph-app my-project --example simple

# Move to the project directory
cd my-project

# Install dependencies
npm i
```

## Integrating WunderGraph with an existing project

You can also easily integrate WunderGraph into your existing projects.

```shell
# In your application directory
npx create-wundergraph-app --init
```

Now edit your `package.json` and add the following scripts, so we can run the WunderGraph server.

```json
{
  "scripts": {
    "start": "wunderctl up --debug",
    "build": "wunderctl generate"
  }
}
```

## Start the WunderGraph server

```shell
npm run start
```

WunderGraph will now do some code generation and start the server.
Head over to [http://localhost:9991](http://localhost:9991) and you should see the WunderGraph status page.

Now lets run one of the example queries, open the following URL in your browser:
[http://localhost:9991/operations/Countries](http://localhost:9991/operations/Countries)

You'll see a JSON response with a list of countries.
Pretty cool, right? Let's take a look at how this works.

## Configure WunderGraph

WunderGraph lives in the `.wundergraph` directory by default. This is where you can configure your WunderGraph application and write your operations.

Let's take a look at the default configuration open `.wundergraph/wundergraph.config.ts`.

You can see that we have a single API configured, which is the [Countries GraphQL API](https://countries.trevorblades.com/).

```ts
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});
```

The API is introspected and added to the WunderGraph virtual graph, as you can see here:

```ts
configureWunderGraphApplication({
  apis: [countries],
  // configuration
});
```

Once it's added to the virtual graph, you can write operations against it.

## Write your first operation

Operations are written in the `.wundergraph/operations` directory. They can be written in Graphql or TypeScript.
Let's check out the Countries operation, open `.wundergraph/operations/Countries.graphql`.

```graphql
query Countries($filter: countries_CountryFilterInput) {
  countries_countries(filter: $filter) {
    code
    name
    capital
  }
}
```

The input type and query are prefixed with `countries_` because we're using the `countries` API namespace in the introspection config. This is to avoid naming conflicts when you add multiple APIs to your WunderGraph application.

We'll make a few improvements to the API. First, let's remove the `countries_` prefix from the result, so we can access the result without the `countries_` prefix.

```graphql
query Countries($filter: countries_CountryFilterInput) {
  countries: countries_countries(filter: $filter) {
    code
    name
    capital
  }
}
```

If you run the operation again, you'll see that the result is the same, but the countries can now be accessed without the `countries_` prefix.

Now we can add some extra data to the result. Let's add the `continent` and `currency` fields to the result.

```graphql
query Countries($filter: countries_CountryFilterInput) {
  countries: countries_countries(filter: $filter) {
    code
    name
    capital
    continent {
      name
    }
    currency
  }
}
```

If you run the operation again, you'll see that the result now contains the `continent` and `currency` fields.

Awesome! You now have a basic understanding how WunderGraph works. The next step is to consume the API from your frontend, continue with one of our frontend quickstarts:

- [Next.js Quickstart](/docs/getting-started/nextjs-quickstart)
- [Vite Quickstart](/docs/getting-started/vite-quickstart)
- [Remix Quickstart](/docs/getting-started/remix-quickstart)

## More Examples

Have a look at [other examples](/docs/examples) we provide, to get a better understanding of WunderGraph.

## Want to know more about WunderGraph?

If you're not yet sure what kind of problems WunderGraph can solve for you,
check out [the different use cases](/docs/use-cases) we support,
and the different [features](/docs/features) we provide.
You might also be interested to learn more about the [architecture](/docs/architecture) of WunderGraph.
If you haven't read our [Manifesto](/manifesto) yet, it's a great way to better understand what we're working on and why.

If you've got questions, please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
