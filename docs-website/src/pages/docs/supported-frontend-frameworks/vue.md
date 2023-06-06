---
title: Vue.js support
description: Wundergraph can be be integrated with Vue through the Vue Query integration.
---

Wundergraph can be be integrated with Vue through the Vue Query integration.

Register the Vue Query plugin :

```ts
import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';

const app = createApp(App);
app.use(VueQueryPlugin);
app.mount('#app');
```

Create the hooks :

```ts
import { createHooks } from '@wundergraph/vue-query';
import { createClient, Operations } from './components/generated/client';

const client = createClient(); // Typesafe WunderGraph client

export const { useQuery, useMutation, useSubscription, useUser, useFileUpload, useAuth, queryKey } =
  createHooks<Operations>(client);
```

Use the hooks :

```ts
const { data, error, isLoading } = useQuery({
  operationName: 'Weather',
  input: { forCity: city },
});
```

## Examples

If you're interested in trying out WunderGraph with Nuxt,
have a look at the following examples:

- [Nuxt + Vue Query](https://github.com/wundergraph/wundergraph/tree/main/examples/nuxt)

If you've got any questions,
please join our Discord Community and ask away.
