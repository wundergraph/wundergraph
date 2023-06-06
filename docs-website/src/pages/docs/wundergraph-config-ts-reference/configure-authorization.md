---
title: Configure Authorization
description: Configuring authorization roles (RBAC)
---

This section explains the `authorization` property of `configureWunderGraphApplication`.

## Example Configuration

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  authorization: {
    roles: ['admin', 'user'],
  },
});
```

WunderGraph has out of the box support for Role Based Access Control (RBAC).
By default, WunderGraph defines two roles, `admin` and `user`,
which you can override or change.

## How RBAC works

If you want to learn more on how RBAC works,
please follow the [Configure Authorization Guide](/docs/guides/configure-authorization).
