import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestAndMockServer, TestServers } from './.wundergraph/generated/testing';
import { IExportTraceServiceRequest, IScopeSpans } from '@opentelemetry/otlp-transformer';
import { getExportRequestProto, ServiceClientType } from '@opentelemetry/otlp-proto-exporter-base';
import { TestContext } from '../mock/types';
import { wait } from '../../setup/util';

let ts: TestServers;

beforeAll(async (ctx) => {
	ts = createTestAndMockServer({
		dir: __dirname,
		env: {
			WG_OTEL_BATCH_TIMEOUT_MS: '100',
		},
	});

	return ts.start({
		mockURLEnvs: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
	});
});

afterAll(() => {
	// Remove persisted mocks
	ts.mockServer.reset();
});

describe('OpenTelemetry', () => {
	it<TestContext>('Should receive all spans for the weather operation', async () => {
		const spans: IExportTraceServiceRequest = {
			resourceSpans: [],
		};

		const scope = ts.mockServer.mock<Record<string, any>>({
			match: ({ url, method }) => {
				return true;
			},
			handler: async ({ raw }) => {
				const buf = await raw();

				const ExportTraceServiceRequestProto = getExportRequestProto(ServiceClientType.SPANS);
				const data = ExportTraceServiceRequestProto.decode(buf);
				const json = data?.toJSON() as IExportTraceServiceRequest;

				spans.resourceSpans?.push(...json.resourceSpans!);

				return {
					status: 200,
				};
			},
			persist: true,
		});

		const result = await ts.testServer.client().query({
			operationName: 'Weather',
			input: {
				forCity: 'Berlin',
			},
		});

		// wait until the spans were exported
		// even though the batch timeout is 100ms, it can take a bit longer
		// until the spans are actually exported and received by the mock server
		await wait(3000);

		scope.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();

		const wundernodeScopeSpans: IScopeSpans[] = [];
		const hookServerScopeSpans: IScopeSpans[] = [];

		spans.resourceSpans?.forEach((span) => {
			const isWunderNodeSpan = !!span.resource?.attributes?.find(
				(attribute) => attribute.key === 'service.name' && attribute.value?.stringValue === 'wundernode'
			);
			const isHookServerSpan = !!span.resource?.attributes?.find(
				(attribute) => attribute.key === 'service.name' && attribute.value?.stringValue === 'hook-server'
			);
			if (isHookServerSpan) {
				hookServerScopeSpans.push(...span.scopeSpans);
			} else if (isWunderNodeSpan) {
				wundernodeScopeSpans.push(...span.scopeSpans);
			}
		});

		expect(wundernodeScopeSpans.length).toBe(2);
		expect(hookServerScopeSpans.length).toBe(1);

		let span = wundernodeScopeSpans.find((scopeSpans) => {
			return scopeSpans.spans?.find((span) => span.name === 'GET /operations/Weather');
		});
		expect(span, 'Client span for the operation call Weather').toBeDefined();

		span = wundernodeScopeSpans.find((scopeSpans) => {
			return scopeSpans.spans?.find((span) => span.name === 'POST /operation/Weather/preResolve');
		});
		expect(span, 'Span for calling the Weather preResolve hook from the wundernode').toBeDefined();

		span = wundernodeScopeSpans.find((scopeSpans) => {
			return scopeSpans.spans?.find((span) => span.name === 'POST /');
		});
		expect(span, 'Span for the origin call to the Weather API').toBeDefined();

		span = hookServerScopeSpans.find((scopeSpans) => {
			return scopeSpans.spans?.find((span) => span.name === 'POST /operation/Weather/preResolve');
		});
		expect(span, 'Span for the work on the preResolve hook on the hooks server').toBeDefined();
	});
});
