import { prefetchQuery } from '$lib/wundergraph';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { queryClient } = await parent();

	await prefetchQuery(
		{
			operationName: 'Dragons',
		},
		queryClient
	);
};
