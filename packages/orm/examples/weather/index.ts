import { Kind, visit } from 'graphql';
import { request } from 'graphql-request';

import { OperationCreator, Executor } from '../../src';
import { Schema, SCHEMA } from './schema';

const executor: Executor = {
	async execute(_operation, document, variables, namespace) {
		const withNamedOperation = visit(document, {
			[Kind.OPERATION_DEFINITION]: (node) => ({
				...node,
				name: {
					kind: Kind.NAME,
					value: 'Test',
				},
			}),
		});
		// api requires named operations
		return await request('https://weather-api.wundergraph.com/', withNamedOperation, variables);
	},
};

(async () => {
	const creator = new OperationCreator<{ schema: Schema }>({
		schema: SCHEMA,
		executor,
		namespace: 'weather',
	});

	const city = await creator
		.query('getCityByName')
		.select('id', 'name', 'weather.clouds.all', 'weather.summary.title')
		.where({ name: 'Los Angeles', config: { lang: 'en' } })
		.exec();

	console.log('result:', city);
})();
