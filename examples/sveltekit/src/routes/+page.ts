export const prerender = false;

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
    const { queryClient } = await parent()
    // TODO: Add prefetching logic here once SSR support is published in npm
}