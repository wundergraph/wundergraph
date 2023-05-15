import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const foo = await graph
			.from('weather')
			.query('getCityByName')
			.select('id', 'name')
			.where({ name: 'Berlin' })
			.exec();

		const bar = await graph
			.from('spacex')
			.query('company')
			.select('ceo', 'employees', 'founded', 'headquarters.city', 'launch_sites')
			.exec();

		const baz = await graph.from('spacex').query('capsules').select('id', 'status', 'dragon').exec();

		const bong = await graph.from('countries').query('country').where({ code: 'DE' }).exec();

		return {
			hello: 'world',
			foo,
			bar,
			baz,
			bong,
		};
	},
});
