import { createClient } from '$lib/generated/client'
import { createWGClient } from '$lib/svelte-query'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()
  
  const {queryKey} = createWGClient(fetch)
  const client = createClient({
    customFetch: fetch
  })  

  await queryClient.prefetchQuery({
    queryKey: queryKey({
        operationName: 'user/Me'
    }),
    queryFn: () => client.query({
        operationName: 'user/Me'
    }) as any
  })
}