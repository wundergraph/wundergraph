import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const result = await graph
			.withHeaders({
				'x-test': 'test',
			})
			.from('sdl')
			.query('sdlField')
			.where({
				sdl: 'test',
			})
			.exec();

		return result;
	},
});
