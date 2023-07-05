import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		header: z.string(),
	}),
	handler: async ({ input, clientRequest, operations }) => {
		const headerValue = clientRequest.headers.get(input.header);
		const forwarded = await operations.query({
			operationName: 'clientRequestHeaderGQL',
			input: {
				header: input.header,
			},
		});
		const overriddenHeaders: Record<string, string> = {};
		overriddenHeaders[input.header] = `${headerValue}_override`;
		const overridden = await operations.withHeaders(overriddenHeaders).query({
			operationName: 'clientRequestHeaderGQL',
			input: {
				header: input.header,
			},
		});
		const addedHeaders: Record<string, string> = {};
		const addedHeaderName = `${input.header}_added`;
		addedHeaders[addedHeaderName] = headerValue ?? '';
		const added = await operations.withHeaders(addedHeaders).query({
			operationName: 'clientRequestHeaderGQL',
			input: {
				header: addedHeaderName,
			},
		});
		return {
			header: input.header,
			forwarded: forwarded.data?.echo_clientRequestHeader ?? '',
			overridden: overridden.data?.echo_clientRequestHeader ?? '',
			added: added.data?.echo_clientRequestHeader ?? '',
		};
	},
});
