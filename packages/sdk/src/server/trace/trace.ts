import { Resource } from '@opentelemetry/resources';
import {
	SpanExporter,
	NodeTracerProvider,
	SpanProcessor,
	AlwaysOnSampler,
	InMemorySpanExporter,
	BatchSpanProcessor,
	BasicTracerProvider,
	SimpleSpanProcessor,
	ParentBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { pino } from 'pino';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// use for debugging e.g. check if the exporter is called, spans are created etc.
// by setting the log level to debug
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const defaultOTLPTraceExporterPath = '/v1/traces';

export interface TelemetryTracerProvider {
	provider: NodeTracerProvider;
}

export interface TelemetryTestTracerProvider {
	provider: BasicTracerProvider;
	exporter: InMemorySpanExporter;
}

export interface TelemetryOptions {
	httpEndpoint: string;
	authToken?: string;
	batchTimeoutMs?: number;
}

export const getTestTracerProvider = (): TelemetryTestTracerProvider => {
	const exporter = new InMemorySpanExporter();
	const provider = new BasicTracerProvider();

	provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

	return { provider, exporter };
};

const configureTracerProvider = (config: TelemetryOptions, logger: pino.Logger): TelemetryTracerProvider => {
	const resource = new Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: 'hook-server',
		[SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
	});

	const provider = new NodeTracerProvider({
		resource,
		// Because the hooks server is never the root of the trace,
		// we always want to sample when the parent is sampled.
		sampler: new ParentBasedSampler({
			root: new AlwaysOnSampler(),
		}),
	});

	provider.addSpanProcessor(getSpanProcessor(config, logger));
	provider.register();

	return { provider };
};

function getExporter(config: TelemetryOptions, logger: pino.Logger): SpanExporter {
	const httpEndpoint = config.httpEndpoint;

	if (httpEndpoint === '') {
		throw new Error('OTLP http endpoint can not be empty');
	}

	const hasAuthHeader = !!config?.authToken;

	if (hasAuthHeader) {
		logger.debug(`configuring OTLPTraceExporter with auth header and endpoint: ${httpEndpoint}`);
	}

	const headers: Record<string, string> = {};
	if (hasAuthHeader) {
		headers['Authorization'] = `Bearer ${config.authToken}`;
	}

	const collectorUrl = normalizeURL(httpEndpoint);

	return new OTLPTraceExporter({
		url: collectorUrl,
		headers,
	});
}

// normalize the endpoint URL, because of the inconsistency in Go and Node.js exporters implementations
export function normalizeURL(endpoint: string): string {
	try {
		const url = new URL(endpoint);

		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			throw new Error(`invalid protocol: ${url.protocol}. Please use http:// or https://`);
		}

		url.pathname = defaultOTLPTraceExporterPath;

		return url.toString();
	} catch (e) {
		throw new Error(`invalid OTLP endpoint: ${endpoint}, error: ${e}`);
	}
}

function getSpanProcessor(config: TelemetryOptions, logger: pino.Logger): SpanProcessor {
	return new BatchSpanProcessor(getExporter(config, logger), {
		// The maximum queue size. After the size is reached spans are dropped.
		maxQueueSize: 2048,
		// The interval between two consecutive exports
		scheduledDelayMillis: config.batchTimeoutMs,
	});
}

export default configureTracerProvider;
