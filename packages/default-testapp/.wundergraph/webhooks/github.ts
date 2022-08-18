import a from './../../foo';
import { buildSchema } from 'graphql';
import type { Webhook } from '@wundergraph/sdk';
import type { InternalClient } from '../generated/wundergraph.internal.client';

const webhook: Webhook<InternalClient, { a: number }, { hello: string; a: number }> = {
	handler: async (event, context) => {
		// demonstrate that we can reference to external packages
		// and don't bundle them into the webhook.
		buildSchema(`scalar DateTime`);

		return {
			statusCode: 200,
			body: {
				hello: 'world',
				a,
			},
		};
	},
};

export default webhook;
