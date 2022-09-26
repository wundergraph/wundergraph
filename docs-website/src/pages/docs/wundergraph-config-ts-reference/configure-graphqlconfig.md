---
title: Configure .graphqlconfig
pageTitle: 'WunderGraph - Configure .graphqlconfig'
description:
---

This `.graphqlconfig` file is very important for an ideal developer experience.
IDEs like VSCode and Jetbrains recognise the file and use it to configure IntelliSense.
It's important to place it in the right directory.
E.g. in VSCode, it's important that you place it at the root of the project.
With the `.graphqlconfig` properly configured, your IDE helps you to define GraphQL Operations.

By default, you don't have to set any configuration. The file will be auto generated on the same directory level as your `.wundergraph` directory.

If you don't want to generate the file you can disable it:

```typescript
configureWunderGraphApplication({
  dotGraphQLConfig: {
    disable: true,
  },
})
```

{% callout type="warning" %}
Some IDEs, like VSCode, will not search for the `.graphqlconfig` file in sub directories.
This means that you will have to manually move the `.graphqlconfig` file to the root directory and fix the path to the GraphQL Schema.
{% /callout %}

The GraphQL Schema is usually located in `.wundergraph/generated/wundergraph.app.schema.graphql`,
with `app` being the name of your application, which might vary.
