import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ operations }) {
		const fastPromise = operations.query({
			operationName: 'incremental/delay',
			input: {
				seconds: 0,
			},
		});
		const slowPromise = operations.query({
			operationName: 'incremental/delay',
			input: {
				seconds: 1,
			},
		});
		const fast = await fastPromise;
		const list: number[] = [];
		yield {
			fast: fast.data,
			slow: null,
			list,
		};
		const slow = await slowPromise;
		yield {
			fast,
			slow: slow.data,
			list,
		};
		for (let i = 0; i < 10; i++) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			list.push(i);
			yield {
				fast: fast.data,
				slow: slow.data,
				list,
			};
		}
	},
});
