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

By default, you don't have to set this configuration. The file will be auto generated next to your `.wundergraph` directory.

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
