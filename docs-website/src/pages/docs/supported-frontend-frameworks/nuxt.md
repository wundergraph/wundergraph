---
title: Nuxt support
description: Wundergraph can be easily be integrated with Nuxt through the Vue Query integration.
---

Wundergraph can be easily be integrated with Nuxt through the Vue Query integration.
Create a `wundergraph.ts` in the `plugins` directory, register the Vue Query plugin and the wundergraph hooks:

```ts
import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query';
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from '@tanstack/vue-query';
import { useState } from '#app';

import { createHooks } from '@wundergraph/vue-query';
import { createClient, Operations } from '../.wundergraph/components/generated/client';

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query');

  const queryClient = new QueryClient();
  const options: VueQueryPluginOptions = { queryClient };

  nuxt.vueApp.use(VueQueryPlugin, options);

  if (process.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (process.client) {
    nuxt.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value);
    });
  }

  const client = createClient(); // Typesafe WunderGraph client
  const wgraph = createHooks<Operations>(client);
  return {
    provide: {
      wundergraph,
    },
  };
});
```

You can then use it like this :

```html
<script setup>
  const { $wundergraph } = useNuxtApp();
  const dragons = $wundergraph.useQuery({
    operationName: 'Dragons',
  });
</script>
```

## Examples

If you're interested in trying out WunderGraph with Nuxt,
have a look at the following examples:

- [Nuxt + Vue Query](https://github.com/wundergraph/wundergraph/tree/main/examples/nuxt)

If you've got any questions,
please join our Discord Community and ask away.
