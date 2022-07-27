---
title: Configure OpenAPI-/REST Datasource
pageTitle: WunderGraph - Configure OpenAPI-/REST Datasource
description:
---

The OpenAPI-/REST data source introspects an OpenAPI Specification and generates a GraphQL schema from it.

## Example Configuration

```typescript
// wundergraph.config.ts
const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  introspection: {
    pollingIntervalSeconds: 2,
  },
})
const myApplication = new Application({
  name: 'app',
  apis: [jsp],
})
```

WunderGraph will automatically cache the introspection result in the local file-system.

If you intend to frequently change the OpenAPI Specification,
e.g. during development,
you should specify the `pollingIntervalSeconds` to 5 seconds for example.
