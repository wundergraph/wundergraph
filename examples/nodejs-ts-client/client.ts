import fetch from 'node-fetch';
import { createClient } from './.wundergraph/generated/client';

async function main() {
	const client = createClient({
		// The URL of your WunderGraph server
		baseURL: 'http://localhost:9991',
		// The fetch implementation to use. Defaults to the global fetch.
		// Fetch is provided by Node.js only with version 18.0.0 and above.
		// This example use a polyfill for backwards compatibility.
		customFetch: fetch as any,
		// Additional headers to send with every request. Defaults to an empty object.
		extraHeaders: {},
	});
	// graphql operation
	const result = await client.query({
		operationName: 'Countries',
		input: {
			filter: {
				code: { eq: 'AD' },
			},
		},
	});
	// ts operation
	const result2 = await client.query({
		operationName: 'users/get',
		input: {
			id: '1',
		},
	});
	const andorra = result.data?.countries_countries[0];
	const user = result2.data;
	console.log({ andorra, user });
}

main()
	.then(() => console.log('done'))
	.catch((err) => console.error('error', err));
