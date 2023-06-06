---
title: Relay Quickstart
pageTitle: WunderGraph - Getting started quickly with Relay
description: Initialize your WunderGraph development environment and get started using Relay
---

This quick start guide will help you to start a new WunderGraph project with Relay from scratch, or add WunderGraph to an existing project. If you are new to relay, checkout [what is relay](#what-is-relay)

## Relay + Next.js

The quickest way to setup a new React + Next.js (CSR / SSR / SSG) project with WunderGraph is to use our next.js template:

```sh
# Init a new project
npx create-wundergraph-app my-project --example nextjs-relay

# Move to the project directory
cd my-project

# Install dependencies
npm i
```

### Start Relay & WunderGraph

```sh
npm run build:wundergraph
npm start
```

WunderGraph will now do some code generation and start WunderNode and Next.js with Relay.
A new browser window will open at [http://localhost:3000](http://localhost:3000). You should see the homepage with the JSON result of the Dragons operation.

```json
[
  { "name": "Dragon 1", "active": true },
  { "name": "Dragon 2", "active": true }
]
```

WunderGraph lives in the `.wundergraph` directory by default. This is where you can configure your WunderGraph application and write your operations.

Let's take a look at the default configuration open `.wundergraph/wundergraph.config.ts`.

You can see that we have [Countries GraphQL API](https://countries.trevorblades.com/) & [SpaceX GraphQL API](https://spacex-api.fly.dev/graphql) configured

```ts
// the name of this const will be supplied to the apis property in the configuration
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});
```

These two APIs are introspected and added to the WunderGraph virtual graph, as you can see here:

```ts
configureWunderGraphApplication({
  apis: [countries, spaceX],
  //...
  generate: {
    codeGenerators: [],
  },
  //...
});
```

We generate a type-safe client specified in the list of generators which we shall use later to make calls to our WunderNode.

### WunderGraph client

If you head over to `src/lib/wundergraph.ts` you will see that we create and export a client and all the necessary hooks to use in our app. We also create a client from cookies that we will use to make authenticated requests.

### Relay Config

If you go to `package.json` you can checkout the relay config:

```json
{
  //....
  "relay": {
    "src": "./src",
    "artifactDirectory": "./src/__relay__generated__",
    "language": "typescript",
    "schema": "./.wundergraph/generated/wundergraph.schema.graphql",
    "exclude": ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**", "**/.wundergraph/generated/**"],
    "persistConfig": {
      "file": "./.wundergraph/operations/relay/persisted.json"
    },
    "eagerEsModules": true
  }
  //...
}
```

The `persistConfig` key generates the operations used by relay & wundergraph will generate code based on it. The `schema` key requires the WunderGraph generated GraphQL schema as reference for relay. Hence you have to generate wundergraph schema first before starting up relay.

### Operations

In Relay, you write GraphQL operations using fragments to declare the data requirements for each React component. Fragments are reusable pieces of a GraphQL query that are defined on a specific type. To use fragments in Relay, lets walkthrough the Dragons operation in the project,

If you go to `src/components/Dragon.tsx`, the dragons fragment will be defined as:

```ts
const AllDragonsFragment = graphql`
  fragment Dragons_display_details on spacex_Dragon {
    name
    active
  }
`;
```

Then in the parent component `src/pages/index.tsx` we will be composing the Query needed for the index page using the fragment using the `...` spread syntax as below

```ts
const PagesDragonsQuery = graphql`
  query pagesDragonsQuery {
    spacex_dragons {
      ...Dragons_display_details
    }
  }
`;
```

When you run `npm start` it will do a few things:

- Runs `relay-compiler` in watch mode, which will generate the relay operations & types
- Runs `wundergraph` compiler which will generate the client sdk based on the relay operations & starts wundergraph server
- Runs the next js project in dev mode

### How Next.js SSR works

The SSR fetch is written in `src/pages/index.tsx` on the `getServerSideProps()`

```ts
export async function getServerSideProps() {
  const relayData = await fetchWunderGraphSSRQuery<PagesDragonsQueryType>(PagesDragonsQuery);

  return {
    props: relayData,
  };
}
```

The relayData will have the `initialRecords` object which will be picked up by the `_app.tsx` component to hydrate the Relay store.

```tsx
function ExampleApp({ Component, pageProps }: AppProps) {
  return (
    <WunderGraphRelayProvider initialRecords={pageProps.initialRecords}>
      <Component {...pageProps} />
    </WunderGraphRelayProvider>
  );
}
```

## What is Relay?

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

### References

- [Thinking in Relay](https://relay.dev/docs/principles-and-architecture/thinking-in-relay/)
- [Official Tutorial](https://relay.dev/docs/tutorial/intro/)
- [API Reference](https://relay.dev/docs/api-reference/relay-environment-provider/)
