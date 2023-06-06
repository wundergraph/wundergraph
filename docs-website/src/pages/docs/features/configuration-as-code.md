---
title: Configuration as Code
description: Configure WunderGraph using TypeScript.
---

One of our core principles is to deliver the best in class Developer Experience possible.
A lot of our competition allows you to configure APIs through user interfaces.

We believe that infrastructure as code is the future and APIs, Middlewares, Caching, Authentication, etc... should be configured using Code, not user interfaces.

Code can be very expressive.
It can help developers understand configuration options and issues of a configuration.
Code can be stored in git, so it's automatically versioned.
Git already comes with authentication so that's another problem not to solve.

Our approach to configuring APIs is to do it on a per-project basis.
Each of your applications will have a dedicated `.wundergraph` folder where you can put all the code to configure the WunderGraph environment that runs alongside your application.

To make the configuration as easy as possible, we've chosen TypeScript as our language of choice.
Of course, you don't have to start from scratch,
instead, you can make use of our TypeScript SDK which makes the configuration not just type safe but super easy.

The benefit of using a TypeScript SDK is that you'll get a lot of flexibility and can any npm package available to customize your configuration.
E.g. if you want to modify the generated GraphQL schema, just import the graphql-js library and modify the AST.

Here's a short example of how a configuration might look like:

```typescript
const db = introspect.postgresql({
  database_querystring: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});
configureWunderGraphApplication({
  apis: [db],
  hooksConfiguration: wunderGraphHooks.config,
  codeGenerators: [
    {
      templates: [
        // use all the typescript react templates to generate a client
        templates.typescript.operations,
        templates.typescript.mocks,
        templates.typescript.linkBuilder,
        templates.typescript.forms,
        ...templates.typescript.react,
      ],
    },
  ],
  cors: {
    ...cors.allowAll,
    allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
  },
  authentication: {
    cookieBased: {
      providers: [authProviders.demo()],
      authorizedRedirectUris: [
        'http://localhost:3000/demo',
        'http://localhost:3000/generatedform',
        'http://localhost:3000/forms',
      ],
    },
  },
  operations: operations,
});
```

This configuration introspects a PostgreSQL database,
creates an Application from it and then builds your WunderGraph configuration including code generation and authentication.

## Getting Started

The easiest way to get started is using our 'create-wundergraph-app' npx command.

To start a new project use the following command,
is scaffolds all required files:

```
npx create-wundergraph-app <project-name>
```

More documentation on the configuration wundergraph.config.ts reference.
