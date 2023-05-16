import { print } from 'graphql';

import { OperationCreator, Executor } from '../../src';
import { Schema, SCHEMA } from './schema';

const executor: Executor = {
	async execute(operation, document, variables, namespace) {
		throw new Error('Not implemented');
	},
};

(async () => {
	const creator = new OperationCreator<{ schema: Schema }>({
		schema: SCHEMA,
		executor,
		namespace: 'foo',
	});

	// @todo `select` exposes internal metadata fields (i.e '__abstract', '__possibleTypes')
	// @todo don't support `select` for union root types (doesn't make sense and complicates type inference)
	const operation = await creator
		.query('gqlUnion')
		.where({ which: 'a' })
		.on('A', (t) => t.select('a', 'id', 'name'))
		.on('B', (t) => t.select('b'));

	// type test = typeof operation['__config']['typeSelection']
	// type test = typeof operation['__config']['fragmentDefinitions']

	const result = await operation.exec();
	console.log('result:', result);

	if (result.__typename === 'A') {
		result.a;
	} else {
		result.b;
	}

	console.log(print(operation.compile()));
})();
