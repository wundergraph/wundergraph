import { createOperation } from '../../generated/wundergraph.factory';
import type { IncrementalDelayResponseData } from '../../generated/models';

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
		let list: IncrementalDelayResponseData[] = [];
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
			const item = await operations.query({
				operationName: 'incremental/delay',
				input: {
					seconds: 1,
				},
			});
			if (item.data) {
				list = [...list, item.data];
			}
			yield {
				fast: fast.data,
				slow: slow.data,
				list,
			};
		}
	},
});
