import { Resource } from '@opentelemetry/resources';
import {
	SpanExporter,
	NodeTracerProvider,
	SpanProcessor,
	TraceIdRatioBasedSampler,
	InMemorySpanExporter,
	BatchSpanProcessor,
	BasicTracerProvider,
	SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
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
	sampler?: number;
}

export const getTestTracerProvider = (): TelemetryTestTracerProvider => {
	const exporter = new InMemorySpanExporter();
	const provider = new BasicTracerProvider();

	provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
	provider.register();

	return { provider, exporter };
};

const configureTracerProvider = (config: TelemetryOptions, logger: pino.Logger): TelemetryTracerProvider => {
	const resource = new Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: 'hook-server',
		[SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
	});

	const provider = new NodeTracerProvider({
		resource,
		sampler: new TraceIdRatioBasedSampler(config.sampler),
	});

	provider.addSpanProcessor(getSpanProcessor(config, logger));
	provider.register({});

	return { provider: provider };
};

function getExporter(config: TelemetryOptions, logger: pino.Logger): SpanExporter {
	const httpEndpoint = config.httpEndpoint;

	if (httpEndpoint === '') {
		throw new Error('OTLP http endpoint can not be empty');
	}

	const [authHeader, hasAuthHeader] = getAuthHeader(config);
	logger.debug(`configuring OTLPTraceExporter with auth header: ${hasAuthHeader} and endpoint: ${httpEndpoint}`);

	const headers: Record<string, string> = {};
	if (hasAuthHeader) {
		headers['Authorization'] = authHeader;
	}

	const collectorUrl = normalizeURL(httpEndpoint, defaultOTLPTraceExporterPath);

	return new OTLPTraceExporter({
		url: collectorUrl,
		headers,
	});
}

// normalize the endpoint URL, because of the inconsistency in Go and Node.js exporters implementations
function normalizeURL(endpoint: string, defaultPath: string): string {
	try {
		const url = new URL(endpoint);

		url.pathname = defaultOTLPTraceExporterPath;

		return url.toString();
	} catch (e) {
		throw new Error(`invalid URL: ${endpoint}, error: ${e}`);
	}
}

function getSpanProcessor(config: TelemetryOptions, logger: pino.Logger): SpanProcessor {
	return new BatchSpanProcessor(getExporter(config, logger), {
		// The maximum queue size. After the size is reached spans are dropped.
		maxQueueSize: 1000,
		// The interval between two consecutive exports
		scheduledDelayMillis: 2500,
	});
}

function getAuthHeader(config: TelemetryOptions): [string, boolean] {
	if (config.authToken) {
		const token = config.authToken;
		if (token !== '') {
			return [token, true];
		}
	}

	return ['', false];
}

export default configureTracerProvider;
