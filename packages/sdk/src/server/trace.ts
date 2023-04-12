import { Resource } from '@opentelemetry/resources';
import { NodeTracerProvider, NoopSpanProcessor, SpanProcessor } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
	AlwaysOnSampler,
	BatchSpanProcessor,
	SpanExporter,
	ConsoleSpanExporter,
	Tracer,
} from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { TelemetryOptions } from '@wundergraph/protobuf';
import { resolveConfigurationVariable } from '../configure/variables';
import { pino } from 'pino';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// use for debugging e.g. check if the exporter is called, spans are created etc.
// by setting the log level to debug
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const defaultOTLPTraceExporterPath = '/v1/traces';
const defaultJaegerExporterPath = '/api/traces';

export interface TelemetryTracerProvider {
	provider: NodeTracerProvider;
}

const configureTracerProvider = (config?: TelemetryOptions, logger?: pino.Logger): TelemetryTracerProvider => {
	const resource = new Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: 'hook-server',
		[SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
	});

	const provider = new NodeTracerProvider({
		resource,
		sampler: new AlwaysOnSampler(),
	});

	provider.addSpanProcessor(getSpanProcessor(config, logger));
	provider.register({});

	return { provider: provider };
};

function getExporter(config?: TelemetryOptions, logger?: pino.Logger): SpanExporter {
	const httpEndpoint = config?.exporterHttpEndpoint ? resolveConfigurationVariable(config.exporterHttpEndpoint) : '';
	const jaegerEndpoint = config?.exporterJaegerEndpoint
		? resolveConfigurationVariable(config.exporterJaegerEndpoint)
		: '';

	if (httpEndpoint !== '' && jaegerEndpoint !== '') {
		throw new Error('cannot configure both OTLP and Jaeger exporters');
	}

	if (httpEndpoint !== '') {
		const [authHeader, hasAuthHeader] = getAuthHeader(config);
		logger?.debug(`configuring OTLPTraceExporter with auth header: ${hasAuthHeader} and endpoint: ${httpEndpoint}`);
		if (hasAuthHeader) {
			return new OTLPTraceExporter({
				url: normalizeURL(httpEndpoint, defaultOTLPTraceExporterPath),
				headers: {
					Authorization: authHeader,
				},
			});
		}

		return new OTLPTraceExporter({
			url: normalizeURL(httpEndpoint, defaultOTLPTraceExporterPath),
		});
	}

	if (jaegerEndpoint !== '') {
		logger?.debug(`configuring JaegerExporter with endpoint: ${jaegerEndpoint}`);
		return new JaegerExporter({
			endpoint: normalizeURL(jaegerEndpoint, defaultJaegerExporterPath),
		});
	}

	return new ConsoleSpanExporter();
}

// normalize the endpoint URL, because of the inconsistency in Go and Node.js exporters implementations
function normalizeURL(endpoint: string, defaultPath: string): string {
	try {
		if (!/^https?:\/\//i.test(endpoint)) {
			endpoint = 'https://' + endpoint;
		}

		const url = new URL(endpoint);

		// Set the default path if it's missing or empty
		if (!url.pathname || url.pathname === '/') {
			url.pathname = defaultPath;
		}

		return url.toString();
	} catch (e) {
		throw new Error(`invalid URL: ${endpoint}, error: ${e}`);
	}
}

function getSpanProcessor(config?: TelemetryOptions, logger?: pino.Logger): SpanProcessor {
	if (config?.enabled) {
		if (resolveConfigurationVariable(config.enabled) == 'true') {
			const exporter = getExporter(config, logger);
			exporter.export;
			return new BatchSpanProcessor(getExporter(config, logger));
		}
	}

	return new NoopSpanProcessor();
}

function getAuthHeader(config?: TelemetryOptions): [string, boolean] {
	if (config?.authToken) {
		const token = resolveConfigurationVariable(config.authToken);
		if (token !== '') {
			return [token, true];
		}
	}

	return ['', false];
}

export default configureTracerProvider;
