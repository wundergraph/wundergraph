import type { Webhook } from '@wundergraph/sdk';
import type { InternalClient } from '../generated/wundergraph.internal.client';

const webhook: Webhook<InternalClient> = {
	handler: async (event, context) => {
		return {
			statusCode: 200,
			body: {
				hello: 'stripe',
			},
			headers: {
				'X-header': 'test',
			},
		};
	},
};

export default webhook;
