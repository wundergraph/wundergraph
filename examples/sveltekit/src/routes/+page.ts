import { prefetchQuery } from '$lib/wundergraph/wundergraph';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ parent }) => {
	const { queryClient } = await parent();

	await prefetchQuery(
		{
			operationName: 'Dragons',
		},
		queryClient
	);
};
