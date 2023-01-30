---
title: Enable autocompletion in your IDE
pageTitle: WunderGraph - Enable autocompletion in your IDE
description: This guide helps you to enable autocompletion in your IDE so that you can easily define and update your GraphQL Operations.
---

One of the principles of using WunderGraph is that you should be able to configure everything using code,
without having to leave your IDE.

When you're defining your GraphQL Operations, it's very important to get autocompletion working in your IDE.
Otherwise, you'd have to guess types and fields, that wouldn't be a pleasant developer experience.

For this reason, all our templates (e.g. the ones you can use with `create-wundergraph-app`) contain a `.graphqlrc.yaml` at the
root directory. This helps your IDE understand the possible fields and types of your WunderGraph application.
When you define your API Dependencies / Data Sources using the `introspect` API from the SDK, WunderGraph generates a virtual Graph,
which is a composed GraphQL Schema of all your API Dependencies.

We're then generating a schema file, as described above, and we also provide a `.graphqlrc.yaml` file pointing to this schema file.

The `.graphqlrc.yaml` file is a YAML file, it usually looks like this:

```yaml
projects:
  app:
    name: app
    schema: '.wundergraph/generated/wundergraph.schema.graphql'
    documents: '.wundergraph/operations/**/*.graphql'
    extensions:
      endpoint:
        introspect: false
        url: 'http://localhost:9991/graphql'
        headers:
          user-agent: 'WunderGraph Client'
```

Depending on your IDE, you have to put this file into the root of your project,
e.g. for VSCode, that's a hard requirement.

Additionally, make sure that you've got a GraphQL plugin installed and up-to-date,
so that your IDE understand the GraphQL language.

If you move the `.graphqlrc.yaml` file to a different location,
make sure that you fix the `schemaPath` to point to the correct location.

If everything is configured properly, restart your IDE.
You should now be able to use autocompletion in your IDE when you're defining your GraphQL Operations.
