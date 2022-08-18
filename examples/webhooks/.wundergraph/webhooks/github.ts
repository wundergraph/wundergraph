import type { Webhook } from '@wundergraph/sdk';
import type { InternalClient } from '../generated/wundergraph.internal.client';

const webhook: Webhook<InternalClient, { a: number }, { hello: string }> = {
	handler: async (event, context) => {
		return {
			statusCode: 200,
			body: {
				hello: 'github',
			},
		};
	},
};

export default webhook;
