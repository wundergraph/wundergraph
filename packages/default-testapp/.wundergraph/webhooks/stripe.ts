import type { Webhook } from '@wundergraph/sdk';
import type { InternalClient } from '../generated/wundergraph.internal.client';

const webhook: Webhook<InternalClient, { id: number }, { title: number }> = {
	handler: async (event, context) => {
		return {
			statusCode: 200,
			body: {
				title: 1,
			},
			headers: {
				'X-Wundergraph-Test': 'test',
			},
		};
	},
};

export default webhook;
