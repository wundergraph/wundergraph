# Migration steps

| Version range   | Migration complexity | Info                |
| --------------- | -------------------- | ------------------- |
| swr-0.4.0-0.5.0 | low                  | Updated to SWR 2.0. |

1. useMutation now returns `trigger` instead of `mutate`.

Old method:

```ts
const { mutate, data, error } = useMutation({
  operationName: 'Foo',
});

mutate({
  input: {
    foo: 'bar',
  },
});
```

Change it to:

```ts
const { trigger, data, error, isMutating } = useMutation({
  operationName: 'Foo',
});

trigger({
  foo: 'bar',
});
```

2. useUser

Old method:

```ts
const { data, error } = useUser({ enabled: false }, { refetchInterval: 10000 });
```

Updated to:

```ts
const { user, error } = useUser({ enabled: false, refetchInterval: 10000 });
```
