import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		header: z.string(),
	}),
	handler: async ({ input, clientRequest, graph }) => {
		const headerValue = clientRequest.headers.get(input.header);
		const forwarded = await graph.from('echo').query('clientRequestHeader').where({ header: input.header }).exec();
		const overriddenHeaders: Record<string, string> = {};
		overriddenHeaders[input.header] = `${headerValue}_override`;
		const overridden = await graph
			.withHeaders(overriddenHeaders)
			.from('echo')
			.query('clientRequestHeader')
			.where({ header: input.header })
			.exec();
		const addedHeaders: Record<string, string> = {};
		const addedHeaderName = `${input.header}_added`;
		addedHeaders[addedHeaderName] = headerValue ?? '';
		const added = await graph
			.withHeaders(addedHeaders)
			.from('echo')
			.query('clientRequestHeader')
			.where({ header: input.header })
			.exec();
		return {
			header: input.header,
			forwarded,
			overridden,
			added,
		};
	},
});
