import { createOperation, z } from '../generated/wundergraph.factory';
import { Client } from '@opensearch-project/opensearch';

export default createOperation.query({
	handler: async () => {
		const client = new Client({
			node: process.env.OS_NODE_URL,
		});

		const query = {
			query: {
				match: {
					title: {
						query: 'The Outsider',
					},
				},
			},
		};

		const result = await client.search({
			index: 'books',
			body: query,
		});

		return result.body;
	},
});
