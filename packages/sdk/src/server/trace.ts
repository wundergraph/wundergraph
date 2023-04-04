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
// use for debugging e.g. check if the exporter is called, spans are created etc.
// import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

export interface TelemetryTracerProvider {
	provider: NodeTracerProvider;
}

const configureTracerProvider = (config?: TelemetryOptions): TelemetryTracerProvider => {
	const resource = new Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: 'hook-server',
		[SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
	});

	const provider = new NodeTracerProvider({
		resource,
		sampler: new AlwaysOnSampler(),
	});

	provider.addSpanProcessor(getSpanProcessor(config));
	provider.register({});

	return { provider: provider };
};

// use for debugging
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

function getExporter(config?: TelemetryOptions): SpanExporter {
	if (config?.otelExporterHttpEndpoint) {
		const url = resolveConfigurationVariable(config.otelExporterHttpEndpoint);
		if (url !== '') {
			return new OTLPTraceExporter({
				url: url,
			});
		}
	}

	if (config?.otelExporterJaegerEndpoint) {
		const endpoint = resolveConfigurationVariable(config.otelExporterJaegerEndpoint);
		if (endpoint !== '') {
			return new JaegerExporter({
				endpoint: endpoint,
			});
		}
	}

	return new ConsoleSpanExporter();
}

function getSpanProcessor(config?: TelemetryOptions): SpanProcessor {
	if (config?.otelEnabled) {
		if (resolveConfigurationVariable(config.otelEnabled) == 'true') {
			return new BatchSpanProcessor(getExporter(config));
		}
	}

	return new NoopSpanProcessor();
}

export default configureTracerProvider;
