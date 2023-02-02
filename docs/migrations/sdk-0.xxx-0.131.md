# Migration steps

| Version range | Migration complexity | Info                                              |
| ------------- | -------------------- | ------------------------------------------------- |
| 0.x-0.131.x   | low                  | Operations directory structure is significant now |

## Update calling operations

Previously, the operations directory structure had no impact on the operation names.
This led to the problem that the operation names were not unique and could lead to conflicts,
e.g. when two operations with the same name were defined in different directories.

From version 0.131.x on, the operation names are derived from the directory structure.

For example, if you have the following directory structure:

```text
operations
├── users
│   ├── create.graphql
│   ├── delete.graphql
```

The operation names will be `users/create` and `users/delete`.

Previously, you were able to call the `create` operation like so:

```typescript
const { data: one } = useQuery({
  operationName: 'create',
  input: {
    id: 1,
  },
});
```

Now you have to specify the full operation name:

```typescript
const { data: one } = useQuery({
  operationName: 'users/create',
  input: {
    id: 1,
  },
});
```

## Update calling operations via the REST / JSON RPC API interface

If you're calling the api via the URL directly, you have to apply the same changes as above.

Here's a curl example how you've used to call the `create` operation:

```bash
curl -X POST http://localhost:9991/operations/create \
  -H 'Content-Type: application/json' \
  -d '{"id": 1}'
```

This needs to be changed to:

```bash
curl -X POST http://localhost:9991/operations/users/create \
  -H 'Content-Type: application/json' \
  -d '{"id": 1}'
```

So, the file structure is now also reflected in the URL of the operation.
