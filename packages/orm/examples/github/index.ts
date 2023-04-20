import { Kind, visit, print } from 'graphql';
import { request } from 'graphql-request';

import { OperationCreator, Executor } from '../../src';
import { Schema, SCHEMA } from './schema';

const PERSONAL_ACCESS_TOKEN = process.env['GITHUB_TOKEN'];

const executor: Executor = {
	async execute(operation, document, variables, namespace) {
		const withNamedOperation = visit(document, {
			[Kind.OPERATION_DEFINITION]: (node) => ({
				...node,
				name: {
					kind: Kind.NAME,
					value: 'Test',
				},
			}),
		});
		console.log(print(withNamedOperation));
		return await request('https://api.github.com/graphql', withNamedOperation, variables, {
			Authorization: `bearer ${PERSONAL_ACCESS_TOKEN}`,
		});
	},
};

(async () => {
	const creator = new OperationCreator<{ schema: Schema }>({
		schema: SCHEMA,
		executor,
	});

	const viewer = await creator
		.query('viewer')
		.select('anyPinnableItems', 'commitComments.__typename', 'company')
		.where({ anyPinnableItems: { type: 'GIST' }, commitComments: { first: 1 } })
		.exec();

	console.log('result:', JSON.stringify(viewer, null, 2));
})();
