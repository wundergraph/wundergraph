import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const responseA = await graph
			.from('oas')
			.mutate('test_endpoint')
			.where({
				input: {
					A_const: 'A',
				},
			})
			.on('A_const_container', (t) => t.select('A_const'))
			.exec();

		const responseB = await graph
			.from('oas')
			.mutate('test_endpoint')
			.where({
				input: {
					mutation_test_endpoint_oneOf_1_Input: { B: 'VALUE' },
				},
			})
			.on('mutation_test_endpoint_oneOf_1', (t) => t.select('B'))
			.exec();

		return {
			responseA: responseA,
			responseB: responseB,
		};
	},
});
