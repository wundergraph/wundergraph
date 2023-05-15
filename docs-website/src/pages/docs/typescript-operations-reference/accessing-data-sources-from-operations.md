---
title: TypeScript Operations Reference
pageTitle: WunderGraph - Reference - TypeScript Operations - Accessing Data Sources from Operations
description:
---

{% callout type="warning" %}
Our ORM is currently alpha so expect bugs and API changes. Please report bugs and feature requests on [GitHub](https://github.com/wundergraph/wundergraph/issues/new/choose) 🙏
{% /callout %}

A configured data source can be accessed from a custom operation via. the `graph` property of your handler's configuration object. See documentation on the [ORM](/docs/features/typescript-orm).

For example, assuming we have a data source defined with the namespace `users` with a query of `get`:

```typescript
import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input, graph }) => {
    const user = await graph.from('users').query('get').where({ id: input.id }).exec();

    return {
      userID: user.id,
      userName: user.name,
    };
  },
});
```
