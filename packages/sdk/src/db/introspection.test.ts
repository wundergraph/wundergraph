import { assert } from 'chai';
import { introspectPrismaDatabaseWithRetries } from './introspection';

test.skip('introspection', async () => {
	const result = await introspectPrismaDatabaseWithRetries(
		{
			databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
		},
		'postgresql',
		1
	);
	assert.equal(result.success, true);
});
