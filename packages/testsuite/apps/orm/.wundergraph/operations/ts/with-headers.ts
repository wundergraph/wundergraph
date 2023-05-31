import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const germany = await graph
			.withHeaders({
				'wg-test': 'test',
			})
			.from('sdl')
			.query('sdlField')
			.where({ sdl: 'test' })
			.exec();
		return germany;
	},
});
