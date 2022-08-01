---
title: Configure .graphqlconfig
pageTitle: 'WunderGraph - Configure .graphqlconfig'
description:
---

This section describes how to set up the configuration for generating the `.graphqlconfig` file.

This file is very important for WunderGraph to work.
It tells your IDE where to look for a GraphQL schema.
If this configuration is wrong,
autocompletion in your IDE will not work when defining GraphQL Operations.

## Example configuration

```typescript
configureWunderGraphApplication({
  dotGraphQLConfig: {
    hasDotWunderGraphDirectory: false,
  },
})
```

By default, you don't have to set this configuration.
However, you might have a project where all WunderGraph files are in the root directory and there's no `.wundergraph` directory.
In this case, you can set `hasDotWunderGraphDirectory` to `false`.

{% callout type="warning" %}
Some IDEs, like VSCode, will not search for the `.graphqlconfig` file in sub directories.
This means that you will have to manually move the `.graphqlconfig` file to the root directory and fix the path to the GraphQL Schema.
{% /callout %}

The GraphQL Schema is usually located in `.wundergraph/generated/wundergraph.app.schema.graphql`,
with `app` being the name of your application, which might vary.
