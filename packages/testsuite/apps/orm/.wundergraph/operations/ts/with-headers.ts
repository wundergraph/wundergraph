import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const germany = await graph
			.withHeaders({
				'Wg-Test': 'test',
			})
			.from('sdl')
			.query('sdlField')
			.where({ sdl: 'test' })
			.exec();

		return germany;
	},
});
