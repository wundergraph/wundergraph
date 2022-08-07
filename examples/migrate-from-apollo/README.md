# Migrate from pure GraphQL servers

This example shows how to use WunderGraph with Apollo GraphQL Client. We're going to expose WunderGraph's GraphQL API to the world. While this is not recommended due to performance and security reasons (see our [blog post](https://wundergraph.com/blog/the_complete_graphql_security_guide_fixing_the_13_most_common_graphql_vulnerabilities_to_make_your_api_production_ready)), it's a great way to migrate from Apollo or any other GraphQL server in smaller steps.

> **Warning**: If you use WunderGraph GraphQL endpoint directly, you opt-out of the Hooks and possible other features.

Essentially, a migration from Apollo to WunderGraph is as simple as moving your GraphQL queries into WunderGraph operations and use the auto-generated Client in your React frontend.

#### Getting started

```shell
npm install && npm start
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
