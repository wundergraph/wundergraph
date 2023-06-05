import { expectTypeOf } from 'vitest';
import { createOperation } from '../../generated/wundergraph.factory';
import { RequestLogger } from '@wundergraph/sdk';

export default createOperation.query({
	handler: async ({ graph, log }) => {
		expectTypeOf(log).toMatchTypeOf<RequestLogger>();

		const germany = await graph.from('countries').query('country').where({ code: 'DE' }).select('code').exec();
		return {
			code: germany.code,
		};
	},
});
