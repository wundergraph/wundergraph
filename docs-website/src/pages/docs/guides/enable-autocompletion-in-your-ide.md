---
title: Enable autocompletion in your IDE
pageTitle: WunderGraph - Enable autocompletion in your IDE
description: This guide helps you to enable autocompletion in your IDE so that you can easily define and update your GraphQL Operations.
---

One of the principles of using WunderGraph is that you should be able to configure everything using code,
without having to leave your IDE.

When you're defining your GraphQL Operations, it's very important to get autocompletion working in your IDE.
Otherwise, you'd have to guess types and fields, that wouldn't be a pleasant developer experience.

When you run `wunderctl up` for the first time, you'll see that we're generating a `.graphqlconfig` file in the `.wundergraph` directory.
Additionally, we're generating a GraphQL Schema file in `.wundergraph/generated/wundergraph.app.schema.graphql`.

We're doing this on purpose, because it helps your IDE understand the possible fields and types of your WunderGraph application.
When you define your API Dependencies / Data Sources using the `introspect` API from the SDK,
WunderGraph generates a [virtual Graph](/docs/core-concepts/virtual-graph),
which is a composed GraphQL Schema of all your API Dependencies.

We're then generating a schema file, as described above, and the `.graphqlconfig` file, pointing to this schema file.

The `.graphqlconfig` file is a JSON file, it usually looks like this:

```json
{
  "projects": {
    "app": {
      "name": "app",
      "schemaPath": "generated/wundergraph.app.schema.graphql",
      "extensions": {
        "endpoints": {
          "app": {
            "introspect": false,
            "url": "http://localhost:9991/app/main/graphql",
            "headers": {
              "user-agent": "WunderGraph Client"
            }
          }
        }
      }
    }
  }
}
```

Depending on your IDE, you have to put this file into the root of your project,
e.g. for VSCode, that's a hard requirement.

Additionally, make sure that you've got a GraphQL plugin installed and up-to-date,
so that your IDE understand the GraphQL language.

If you move the `.graphqlconfig` file to a different location,
make sure that you fix the `schemaPath` to point to the correct location.

If everything is configured properly, restart your IDE.
You should now be able to use autocompletion in your IDE when you're defining your GraphQL Operations.
