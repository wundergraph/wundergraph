import { createWGClient } from '$lib/svelte-query'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  const {prefetchQuery} = createWGClient(fetch)
    
  await prefetchQuery({
    operationName: 'Todos'
  }, queryClient)
}