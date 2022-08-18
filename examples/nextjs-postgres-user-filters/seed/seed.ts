import { Client } from '../.wundergraph/generated/wundergraph.client';
import fetch from 'node-fetch';

const seed = async () => {
	const client = new Client({
		customFetch: (input, init) => fetch(input, init),
	});
	const user = await client.query.UserByEmail({
		input: {
			email: 'jens@wundergraph.com',
		},
	});
	if (user.status === 'ok' && user.body.data.db_findFirstUser) {
		return;
	}
	const nodes = await client.mutation.CreateNode({
		input: {
			data: [
				{
					name: 'A',
					created_at: new Date(2020, 0, 1).toISOString(),
				},
				{
					name: 'B',
					created_at: new Date(2020, 0, 2).toISOString(),
				},
				{
					name: 'C',
					created_at: new Date(2020, 0, 3).toISOString(),
				},
				{
					name: 'D',
					created_at: new Date(2020, 0, 4).toISOString(),
				},
			],
		},
	});
	console.log('seed:nodes', nodes);
	const out = await client.mutation.CreateUser({
		input: {
			data: {
				name: 'Jens',
				email: 'jens@wundergraph.com',
				Filter: {
					create: {
						node_created_after: new Date(2020, 0, 2).toISOString(),
					},
				},
			},
		},
	});
	console.log('seed:user', JSON.stringify(out));
};

seed();
