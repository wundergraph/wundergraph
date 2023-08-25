---
title: 'Thinking in API Dependencies'
tags: []
date: 2022-01-02
description: Learn the concept of API dependencies and how to use them in your application.
layout: 'wg_by_example'
---

In the Hello World article, we created a simple application that uses the SpaceX API,
but we didn't really talk about how it works and why it's designed the way it is.

Let's add a few more "API dependencies" to our application and discuss the design decisions behind it.

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/datasources';

const spaceX = graphql({
  namespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

const weather = graphql({
  namespace: 'weather',
  url: 'https://weather-api.wundergraph.com/',
});

const countries = graphql({
  namespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

export default {
  datasources: [spaceX, weather, countries],
} satisfies WunderGraphConfig;
```

This will add the SpaceX, Weather and Countries API to our project as API dependencies.
But what does it actually mean to add an API dependency?

When writing software, we usually think in terms of "components" or "modules".
We write a module that does one thing, and then we use it in another module.
If we wanted to use it in another codebase, we could also publish it as a package and install it from a package manager.

In WunderGraph, we've taken this idea and applied it to APIs.
So when you use a `datasource` function, you're basically importing an API as a dependency.
If you then pass it to the `config`, you're basically saying that you want to use this API in your application.

There's one more important thing to note here, the `namespace` property.
Imagine you have a lot of exported functions, classes, etc. in a single module,
wouldn't that be hard to use? Yes, of course it would.
And that's why almost all languages have some kind of namespacing mechanism,
like packages in Java, modules in JavaScript, etc.

We've adopted this idea for APIs as well.
So when you add an API dependency, you can specify a namespace for it.
That's like giving an imported module a name.

## Why we've added namespaces

Aside from the obvious benefits of namespacing, there's another reason why we've added namespaces to WunderGraph.
When you add multiple APIs as dependencies,
WunderGraph internally creates a single GraphQL schema that contains all the types from all the APIs.
If two APIs have a type with the same name, but different fields, we will not be able to automatically merge them.

Our initial solution was to offer functions like `renameType` and `renameField` to rename types and fields.
This worked, but it would mean that constantly have to rename types and fields when you add new APIs with merge conflicts.
Our philosophy is that you should get more value from WunderGraph by adding more APIs,
so you should not have to do any manual steps to make it work.
