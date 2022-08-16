import a from './../../foo';
import { buildSchema } from 'graphql';
import type { WebHook } from '@wundergraph/sdk';

const webhook: WebHook = {
	handler: async (req, reply) => {
		buildSchema(`scalar DateTime`);
		reply.code(200).send({
			hello: 'world',
			a,
		});
	},
};

export default webhook;
