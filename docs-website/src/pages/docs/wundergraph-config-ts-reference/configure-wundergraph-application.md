---
title: Configure WunderGraph Application
pageTitle: WunderGraph - Configure WunderGraph Application
description:
---

This section describes how to configure a WunderGraph application.

```typescript
// wundergraph.config.ts

// configureWunderGraph builds the config for your WunderGraph application
configureWunderGraphApplication({
  apis: [spaceX, jsp, weather, countries],
})
```

So, if you've created an Operation with the name `TopProducts`,
it will be accessible at the following URL:

```
http://localhost:9991/operations/TopProducts
```
