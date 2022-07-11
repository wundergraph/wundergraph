# Hooks

WunderGraph Hooks are an essential part to customize the Request Lifecycle of WunderGraph Applications.
All hooks are defined in the `wuundergraph.config.ts` file with type-safety and autocompletion.

> **Note**: Currently, hooks are limited to HTTP data-sources.

## Hooks summary

Here you can see the list of hooks that WunderGraph provides.

```
Hooks Overview
│
└─▶ Global HTTP Hooks
│   │
│   └─▶ onOriginRequest (e.g. Request manipulation, early return, for each external data-source call)
│   │
│   └─▶ onOriginResponse (e.g. Response manipulation, cancelling)
│
└─▶ Operational Hooks
    │
    └─▶ preResolve (e.g. Logging)
    │
    └─▶ mutatingPreResolve (e.g. Input manipulation)
    │
    └─▶ customResolve (e.g. Early return, custom response)
    │
    └─▶ (Internal) WunderGraph Engine - Resolve operation
    │
    └─▶ postResolve (e.g. Logging)
    │
    └─▶ mutatingPostResolve (e.g. Input manipulation, custom response)
    │
    └─▶ postAuthentication (e.g. Logging)
    │
    └─▶ mutatingPostAuthentication (e.g. Validation)
```

> **Note**: Global HTTP hooks as the name suggests, only fires for HTTP data-sources.

## Hooks request lifecycle

This section describes the lifecycle of a single request.

```
Incoming Request
        │
        └─▶ preResolve
            │
            └─▶ mutatingPreResolve
                │
         exit ◀─┴─▶ customResolve
                │
                └─▶ (Internal) WunderGraph Engine - Resolve operation
                    │
                    └─▶ onOriginRequest (For each external HTTP data-source call)
                    │   │
                    │   └─▶ onOriginResponse (Companion to onOriginRequest)
                    │
                    └─▶ postResolve
                        │
                        └─▶ mutatingPostResolve
                            │
                            └─▶ postAuthentication
                              │
                       exit ◀─┴─▶ mutatingPostAuthentication
                                  │
                           exit ◀─┴─▶ onResponse
                                  │
                                  └─▶ Outgoing Response
```

For more information about the hooks, check the official [documentation](https://wundergraph.com/docs/reference/wundergraph_hooks_ts/overview).
