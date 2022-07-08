# Migration steps

| Version range | Migration complexity | Info                                          |
| ------------- | -------------------- | --------------------------------------------- |
| 0.60-0.90.x   | low                  | Type-safe hooks, Non-blocking code generation |

## 1. Comment the imports of `wundergraph.hooks.ts` and `wundergraph.operations.ts` in `wundergraph.config.ts`

## 2. Update the SDK to the latest version.

## 3. Delete your local `generated` folder and run `wunderctl generate`

## 4. Rename the file `wundergraph.hooks.ts` to `wundergraph.server.ts`

## 5. Update `configureWunderGraphServerWithClient` in `wundergraph.server.ts`

to match the signature

```ts
configureWunderGraphServerWithClient<HooksConfig, InternalClient>((serverContext) => ({
  hooks: {
    queries: {},
    mutations: {},
  },
}));
```

_Import all required types._

## 6. Update `configureWunderGraphOperations` in `wundergraph.operations.ts`

to match the signature

```ts
configureWunderGraphOperations<OperationsConfiguration>({
  operations: {},
});
```

_Import all required types._

## 7. Change imports in `wundergraph.config.ts`

From

```ts
import hooks from './wundergraph.hooks';
import operations from './wundergraph.operations';
```

To

```ts
import server from './wundergraph.server';
import operations from './wundergraph.operations';
```

## 8. Update the `configureWunderGraphApplication` config object in `wundergraph.config.ts`.

From

```ts
configureWunderGraphApplication({
  application: myApplication,
  hooks: hooks,
  operations: operations,
});
```

To

```ts
configureWunderGraphApplication({
  application: myApplication,
  hooks: server.hooks,
  operations,
});
```

## 9. Run the server with `wunderctl up`
