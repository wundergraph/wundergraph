import configureTracerProvider, { normalizeURL } from './trace';
import pino from 'pino';

describe('Trace', () => {
	test('Should be able to create a trace provider', async () => {
		const tp = configureTracerProvider(
			{
				sampler: 1,
				authToken: '123',
				httpEndpoint: 'http://localhost:4317',
			},
			pino({
				enabled: false,
			})
		);

		expect(tp).toBeDefined();
	});

	test('Should correct normalize the endpoint url', async () => {
		expect(normalizeURL('http://localhost:4317')).toBe('http://localhost:4317/v1/traces');
		expect(normalizeURL('https://localhost:4317')).toBe('https://localhost:4317/v1/traces');
		expect(normalizeURL('http://localhost:4317/')).toBe('http://localhost:4317/v1/traces');
		expect(normalizeURL('https://localhost:4317/')).toBe('https://localhost:4317/v1/traces');
		expect(() => normalizeURL('localhost:4317')).toThrow('invalid protocol: localhost:');
	});
});
