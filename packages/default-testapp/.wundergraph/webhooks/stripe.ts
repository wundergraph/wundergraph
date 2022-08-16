import type { WebHook } from '@wundergraph/sdk';

const webhook: WebHook = {
	handler: async (req, reply) => {
		reply.code(200).send({
			hello: 'stripe',
		});
	},
};

export default webhook;
