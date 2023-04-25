---
title: '@hooksVariable Directive'
pageTitle: WunderGraph - Directives - @hooksVariable
description:
---

The `@hooksVariable` directive is useful when working with Hooks.

Imagine you've define an Operation like this:

```graphql
query Missions($find: MissionsFind) {
  missions(find: $find) {
    id
  }
}
```

Now let's say, you'd like to "filter" the missions using an extra variable.

Doing so, you could implement a hook:

```typescript
const wunderGraphHooks = ConfigureWunderGraphHooks({
  // generated
  queries: {
    // generated
    Missions: {
      // generated
      async mutatingPostResolve(ctx, input, response) {
        // user defined
        return {
          ...response,
          data: {
            ...response.data,
            missions: response.data.missions.filter((mission) => mission.name === 'Telstar'), // using a static string
          },
        };
      },
    },
  },
});
```

This hook can "statically" filter all missions by name.
But what about dynamic hooks?
This is where the `@hooksVariable` comes into play.

Let's modify our Query:

```graphql
query Missions($find: MissionsFind, $filter: String! @hooksVariable) {
  missions(find: $find) {
    id
  }
}
```

As you can see, we've defined an additional variable.
By default, this Operation would be invalid though.
This is because we're violating the GraphQL validation rules.
GraphQL Variables must always be used within the document.
However, our intention is to not use this Variable within the GraphQL Query but pass it on to the Hook.
This is what the `@hooksVariable` directive is meant for.
By applying it to a Variable, we'll remove it from the GraphQL Query but will keep it in the JSON Schema Definition of the Operation.

As a result, we're no able to use the filter Variable from within the hook:

```typescript
const wunderGraphHooks = ConfigureWunderGraphHooks({
  // generated
  queries: {
    // generated
    Missions: {
      // generated
      async mutatingPostResolve(ctx, input, response) {
        // user defined
        return {
          ...response,
          data: {
            ...response.data,
            missions: response.data.missions.filter((mission) => mission.name === input.filter), // now using the $filter Variable
          },
        };
      },
    },
  },
});
```
