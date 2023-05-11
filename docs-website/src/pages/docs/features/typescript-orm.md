---
title: TypeScript ORM
pageTitle: WunderGraph - Features - TypeScript ORM
description: The TypeScript ORM allows you to access data sources fluently from TypeScript
---

The data sources that you add to your WunderGraph application can be accessed via. our purpose-built TypeScript ORM (object-relational mapper).

## Setup

{% callout type="warning" %}
Our ORM is currently alpha so expect bugs and API changes. Please report bugs and feature requests on [GitHub](https://github.com/wundergraph/wundergraph/issues/new/choose) 🙏
{% /callout %}

Since the ORM is experimental you must explicitly opt-in to said functionality. Set `experimental.orm` to `true` in your `wundergraph.config.ts`.

```typescript
import { configureWunderGraphApplication } from '@wundergraph/sdk';

configureWunderGraphApplication({
  // ...
  experimental: {
    // The ORM will now be available to your operation handlers
    // on the `graph` reference!
    orm: true,
  },
});
```

## Operations

The ORM supports read, write, and subscribe operations on the data sources configured in your WunderGraph application.

### Reads

Read operations are specified via. the `query` method. For example,

```typescript
const user = await graph.from('foo').query('user').where({ id: 'bar' }).exec();

// => { id: 'bar' }
```

### Writes

Write operations are specified via. the `mutate` method. For example,

```typescript
const user = await graph
  .from('foo')
  .mutate('createUser')
  .where({ name: { first: 'John', last: 'Cena' } })
  .exec();

// => { id: 'abc', name: { first: 'John', last: 'Cena' }, createdAt: '2023-04-16T09:34:37.192Z' }
```

### Subscriptions

Stream operations are specified via. the `subscribe` method. For example,

```typescript
const userUpdates = await graph.from('foo').subscribe('userUpdated').where({ id: 'abc' }).exec();

for (const user of userUpdates) {
  // => { id: 'abc', name: { first: 'John', last: 'Cena' }, createdAt: '2023-04-16T09:34:37.192Z' }
}
```

## Nested and Filtered Selections

As a convenience the ORM will select all scalar fields on an object type. In-order-to retrieve relations (or other arbitrarily nested fields on the object) and/or filter unwanted fields, one can provide a list of property paths to the `select` method. For example,

```typescript
const result = await graph
  .from('people')
  .query('user')
  .select('id', 'firstName', 'friends.firstName', 'friends.lastName')
  .where({ id: 'abc', fiends: { limit: 1 } })
  .exec();

// => { id: 'abc', firstName: 'John', friends: [{ firstName: 'Hulk', lastName: 'Hogan' }] }
```

## Conditional Types

An important feature of the ORM is the support for interacting with types that are variable at runtime. As our virtual graph utilizes GraphQL to define it's semantics, the ORM encodes this behavior similarly.

### Union Types

A [union](https://spec.graphql.org/October2021/#sec-Unions) defines a set of possible types that the returned object may represent. The ORM currently **requires specifying the fields you would like returned for each possible type**. Select type-specific fields using the `on(fields: ...Array<string>)` method, for example:

```typescript
const someType = await graph
  .query('unionType')
  .on('A', (t) => t.select('a'))
  .on('B', (t) => t.select('b'))
  .exec();

// utilize the `__typename` meta field to distinguish types at runtime
if (someType.__typename === 'A') {
  console.log(someType.a);
} else {
  console.log(someType.b);
}
```

### Interface Types

An [interface](https://spec.graphql.org/October2021/#sec-Interfaces) defines a common set of properties that multiple objects can adhere to. For example, a `Query.node(id: ID!)` API (under the `foo` namespace) could be accessed like so:

```ts
// given `interface Node { id: iD! }`

const interfaceObject = await graph.from('foo').query('node').exec();

// { __typename: "SomeImplementation", id: "abc" }
```

**Note**: The ORM does not currently auto-select interface fields (i.e each field must be selected on each type). This will be improved soon!
