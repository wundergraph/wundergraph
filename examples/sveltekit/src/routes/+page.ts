import { prefetchQuery } from '$lib/wundergraph/wundergraph';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { queryClient } = await parent();

	prefetchQuery(
		{
			operationName: 'GetUser',
		},
		queryClient
	);
};
