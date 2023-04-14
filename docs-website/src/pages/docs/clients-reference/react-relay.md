---
title: React Relay Client
pageTitle: WunderGraph React Relay Client
description: React Relay Client reference
---

This package provides a type-safe integration of [Relay](https://relay.dev/) with WunderGraph.

The quickest way to setup a new React + Relay project with WunderGraph is to use our template:

```sh
npx create-wundergraph-app my-project --example vite-react-relay
```

Relay is a JavaScript framework for building data-driven React applications, efficiently fetching and managing data from GraphQL APIs. It optimizes network requests, simplifies client-side data management, and enables performant, scalable apps.

Relay has several advantages over other GraphQL clients:

- **Performance optimizations**: Relay automatically batches multiple queries into a single request, reducing network overhead. It also intelligently updates the local cache when mutations occur, reducing the need for manual cache management.
- **Declarative data fetching**: Components declare their own data requirements using GraphQL fragments, making it easier to understand and manage component data dependencies.
- **Strong typing**: Relay's use of the GraphQL type system and generated TypeScript types helps catch errors early during development, improving code reliability and maintainability.
- **Predictive fetching**: Relay's support for prefetching data means that it can fetch data for components before they are rendered, reducing perceived load times and improving user experience.
- **Colocation**: By colocating data requirements with components, Relay makes it easier to reason about how a component fetches and uses data, which simplifies development and debugging.
- **Built-in garbage collection**: Relay's garbage collection mechanism helps keep the client-side cache small and efficient, reducing memory usage in long-running applications.

These features make Relay a powerful choice for complex, data-driven React applications, offering performance benefits and improved maintainability compared to some other GraphQL clients. Relay has it's own compiler and codegenerator package called `relay-compiler`. Relay uses the `relay-compiler` for several important reasons:

1. **Generating artifacts**: The `relay-compiler` processes GraphQL files and generates artifacts containing optimized queries and metadata. These artifacts are used by the Relay runtime to efficiently fetch and manage data.
2. **Optimizing queries**: The compiler optimizes GraphQL queries by flattening and deduplicating nested fragments, reducing query size and complexity. This helps improve the performance of network requests.
3. **Validation**: The `relay-compiler` validates your GraphQL queries and fragments against your GraphQL schema, catching errors early in the development process. This helps ensure that your queries are correct and conform to your schema.
4. **Type generation**: When using TypeScript, the `relay-compiler` generates TypeScript types for your GraphQL schema, queries, and fragments. This provides strong typing for your Relay application, improving code reliability and maintainability.
5. **Colocation**: The `relay-compiler` enforces the colocation principle, which means keeping GraphQL fragments and their corresponding React components in the same file. This makes it easier to reason about and manage data dependencies in your application.

In summary, the `relay-compiler` is a crucial part of the Relay ecosystem, as it generates artifacts, optimizes queries, validates queries against the schema, generates TypeScript types, and enforces colocation. These features help Relay applications to be more efficient, reliable, and maintainable.

The relay-compiler will need to be configured to function with the WunderGraph client. Instead of writing client side operations in `.wundergraph/operations` like all the other clients, we will instead write them alongside the react components and have relay generate the code using `relay-compiler`, while using WunderGraph to serve as the relay's client side environment for making network requests.
