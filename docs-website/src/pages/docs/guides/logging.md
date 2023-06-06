---
title: Logging
pageTitle: WunderGraph - Logging
description: Learn how to use the structured logging in your WunderGraph application
---

WunderGraph includes built-in support for structured logging, using the `RequestLogger`
interface.

This interface provides logging through functions with the given prototype:

```typescript
	<T extends LogObject>(msg: string, obj?: T): void;
```

This means every logging function accepts a `string` as a first argument that represents the
log message, optionally followed by an object with additional properties to be logged as JSON.
For example, calling `logger.debug('hello', { a: 1, b: 2 });` will produce
`{"level":"debug","a":1,"b":2,"msg":"hello"}`

## Error handling

If the second argument passed to a logging function is an `Error` or if it contains an `error` property,
it will be interpreted as an error to be unwrapped, logging its message and stack too.

```typescript
logger.warn('something bad happened', new Error('unexpected'));
// prints  "{\"level\":\"warn\",\"error\":{\"type\":\"Error\",\"message\":\"unexpected\",\"stack\":\"Error: unexpected\\n    at /path/to/your/file.ts:42
```

## Attaching additional properties to a `RequestLogger`

`RequestLogger` implements also a `withFields()` function, which allows creating a new logger with the
same level but with additional properties attached, avoiding repeating the same arguments multiple times.
This means, these two blocks are equivalent:

```typescript
// Pass additional properties every time
logger.info('logged in', { user: 'admin' });
logger.info('fetching profile data', { user: 'admin' });

// Create a logger with the user property attached
userLogger = logger.withFields({ user: 'admin' });
userLogger.info('logged in');
userLogger.info('fetching profile data');
```

## Output formats

All logs are produced in JSON. During development (with `wunderctl up`) logs are provided with colorized
output based on their levels. In production (with `wunderctl start`) logs are printed to the standard
output as JSON formatted lines.

## Availability

### Functions

In functions the WunderGraph `RequestLogger` is available as part of the context:

```typescript
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  handler: async ({ input, operations, log }) => {
    log.info('hello', { from: 'function' });
  },
});
```

### Hooks

In the same as functions, `RequestLogger` is available through the context:

```typescript
export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      MyOperation: {
        postResolve: async ({ log }) => {
          log.info('hello', { from: 'hook' });
        },
      },
    },
    mutations: {},
  },
}));
```

### Webhooks

In webhooks, the `RequestLogger` is part of the context:

```typescript
export default createWebhook<WebhookHttpEvent<{}>, WebhookHttpResponse<{}>>({
  handler: async (event, context) => {
    context.log('hello', { from: 'webhook' });
  },
});
```

### Builtin GraphQL server

In GraphQL handlers, the `RequestLogger` can be accessed via the `ctx.wundergraph` property:

```typescript
schema: new GraphQLSchema({
    query: new GraphQLObjectType<any, GraphQLExecutionContext<any>>({
        name: 'Query',
        fields: {
            myQuery: {
                type: GraphQLString,
                resolve: async (parent, args, ctx) => {
                    ctx.wundergraph.log.info('hello', {from: 'graphql'});
                },
            },
```
