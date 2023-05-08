import { print } from 'graphql';

import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const foo = await graph
			.from('weather')
			.query('getCityByName')
			.where({ name: 'Berlin' })
			.select('id', 'name')
			.exec();

		const bar = await graph
			.from('spacex')
			.query('company')
			.select('ceo', 'employees', 'founded', 'headquarters.city', 'launch_sites')
			.exec();

		const baz = await graph.from('spacex').query('capsules').select('id', 'status', 'dragon').exec();

		return {
			hello: 'world',
			foo,
			bar,
			baz,
		};
	},
});
