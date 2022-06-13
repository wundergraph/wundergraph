# Hooks

WunderGraph Hooks are an essential part to customize the Request Lifecycle of WunderGraph Applications.
All hooks are defined in the `wuundergraph.config.ts` file with type-safety and autocompletion.

## Hooks summary

Here you can see the list of hooks that WunderGraph provides.

```
Hooks Overview
│
└─▶ Global Hooks
│   │
│   └─▶ onRequest (e.g. Request manipulation, early return)
│   │
│   └─▶ onResponse (e.g. Response manipulation, cancelling)
│
└─▶ Operation Hooks
│
└─▶ preResolve (e.g. Logging)
│
└─▶ mutatingPreResolve (e.g. Input manipulation)
│
└─▶ customResolve (e.g. Early return, custom response)
│
└─▶ WunderGraph Engine (Resolve operation from data-source)
│
└─▶ postResolve (e.g. Logging)
│
└─▶ mutatingPostResolve (e.g. Input manipulation, custom response)
│
└─▶ mutatingPostAuthentication (e.g. Validation)
```

## Hooks request lifecycle

This section describes the lifecycle of a single request.

```
Incoming Request
        │
 exit ◀─┴─▶ onRequest
            │
            └─▶ preResolve
                │
                └─▶ mutatingPreResolve
                    │
             exit ◀─┴─▶ customResolve
                    │
                    └─▶ WunderGraph Engine (Resolve Operation)
                        │
                        └─▶ postResolve
                            │
                            └─▶ mutatingPostResolve
                                │
                         exit ◀─┴─▶ mutatingPostAuthentication
                                    │
                             exit ◀─┴─▶ onResponse
                                    │
                                    └─▶ Outgoing Response
```

For more information about the hooks, check the official [documentation](https://wundergraph.com/docs/reference/wundergraph_hooks_ts/overview).
