---
title: Configure WunderGraph Application
pageTitle: WunderGraph - Configure WunderGraph Application
description:
---

This section describes how to configure a WunderGraph application.

```typescript
// wundergraph.config.ts
const myApplication = new Application({
  name: 'app',
  apis: [spaceX, jsp, weather, countries],
})
```

The `name` property is not just used to identify the application,
but also responsible to determine the URL path of it.

Naming your application `app` will result in the following URL path:

```
http://localhost:9991/app/main/
```

So, if you've registered an Operation with the name `TopProducts`,
it will be accessible at the following URL:

```
http://localhost:9991/app/main/operations/TopProducts
```

The second argument of the `Application` constructor is an array of data sources.
Simply pass all the APIs you've introspected using the `introspect` API of the SDK.
