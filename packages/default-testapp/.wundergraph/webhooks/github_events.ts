import a from './../../foo';
import { buildSchema } from 'graphql';

export default {
	handler: async () => {
		buildSchema(`scalar DateTime`);

		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Hello World', a }),
		};
	},
};
