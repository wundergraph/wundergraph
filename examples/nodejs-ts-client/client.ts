import fetch from 'node-fetch';
import { createClient } from './.wundergraph/generated/client';

async function main() {
	const client = createClient({
		// The URL of your WunderGraph server
		baseURL: 'http://localhost:9991',
		// The fetch implementation to use. Defaults to the global fetch.
		// Fetch is provided by Node.js only version 18.0.0 and above.
		// This example use a polyfill for backwards compatibility.
		customFetch: fetch as any,
		// Additional headers to send with every request. Defaults to an empty object.
		extraHeaders: {},
	});
	const result = await client.query({
		operationName: 'Countries',
		input: {
			filter: {
				code: { eq: 'AD' },
			},
		},
	});
	const andorra = result.data?.countries_countries[0];
	console.log(andorra);
}

main()
	.then(() => console.log('done'))
	.catch((err) => console.error('error', err));
