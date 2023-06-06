import { introspect } from '../definition';
import { assert } from 'chai';

test.skip('introspect federation', async () => {
	const generator = await introspect.federation({
		apiNamespace: 'federation',
		upstreams: [
			{ url: 'http://localhost:4001/graphql' },
			{ url: 'http://localhost:4002/graphql' },
			{ url: 'http://localhost:4003/graphql' },
			{ url: 'http://localhost:4004/graphql' },
		],
	});
	const federated = await generator({});
	assert.notEqual(federated.Schema, '');
});
