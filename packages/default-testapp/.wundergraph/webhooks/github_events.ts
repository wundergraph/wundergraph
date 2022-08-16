import a from './../../foo';
import { buildSchema } from 'graphql';

export default {
	handler: async (event) => {
		buildSchema(`SCALAR DateTime`);

		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Hello Worldedd', a }),
		};
	},
};
