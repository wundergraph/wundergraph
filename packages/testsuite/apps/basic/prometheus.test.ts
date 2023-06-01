import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('Prometheus', () => {
	it('should include operation metrics', async () => {
		const { error, data } = await wg.client().query({ operationName: 'countries/Continent', input: { code: 'EU' } });

		expect(data).toBeDefined();
		expect(error).toBeUndefined();

		const resp = await fetch(wg.promMetricEndpoint());
		const metrics = await resp.text();

		// Outgoing request to countries.trevorblades.com
		expect(metrics).toMatch(
			/wundernode_api_transport_outgoing_http_requests_total{host="countries.trevorblades.com",method="POST",statusCode="200"} 1/
		);

		// Operations counters
		expect(metrics).toMatch(/wundernode_http_requests_total{operationName="CountriesContinent",statusCode="200"} 1/);
		expect(metrics).toMatch(/wundernode_http_request_duration_seconds_count{operationName="CountriesContinent"} 1/);
		expect(metrics).toMatch(/wundernode_http_request_size_bytes_count{operationName="CountriesContinent"} 1/);
		expect(metrics).toMatch(/wundernode_http_response_size_bytes_count{operationName="CountriesContinent"} 1/);
	});
});
