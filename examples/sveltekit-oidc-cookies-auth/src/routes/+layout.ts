import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (event) => {    
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })
  
  return { queryClient }
}