import { FastifyPluginAsync } from 'fastify';
import { propagation, Span, SpanStatusCode, trace, Context, Tracer, ROOT_CONTEXT } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import fp from 'fastify-plugin';
import { FastifyRequestContext } from '../types';
import { WgEnv } from '../../configure/options';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { setStatus } from '../trace/util';

export interface FastifyTelemetry {
	context: Context;
	parentSpan: Span;
}

declare module 'fastify' {
	interface FastifyRequest extends FastifyRequestContext {
		telemetry?: FastifyTelemetry;
	}
	interface FastifyInstance {
		tracer?: Tracer;
	}
}

export interface TelemetryPluginOptions {
	provider: NodeTracerProvider;
}

const FastifyTelemetryPlugin: FastifyPluginAsync<TelemetryPluginOptions> = async (fastify, options) => {
	const tracer = options.provider.getTracer('hook-server', '0.0.1');

	fastify.decorate<Tracer>('tracer', tracer);

	fastify.addHook('onRequest', async (req, resp) => {
		const activeContext = propagation.extract(ROOT_CONTEXT, req.headers);
		const span = tracer.startSpan(`${req.method} ${req.url}`, { startTime: performance.now() }, activeContext);

		// Overwrite decorator per request to ensure encapsulation
		req.telemetry = {
			parentSpan: span,
			context: trace.setSpan(activeContext, span),
		};

		req.telemetry.parentSpan.setAttributes({
			[SemanticAttributes.HTTP_FLAVOR]: req.raw.httpVersion,
			[SemanticAttributes.HTTP_METHOD]: req.raw.method,
			[SemanticAttributes.HTTP_ROUTE]: req.routerPath,
			[SemanticAttributes.HTTP_URL]: req.raw.url,
			[SemanticAttributes.NET_PEER_NAME]: process.env[WgEnv.ServerHost],
			[SemanticAttributes.NET_PEER_PORT]: process.env[WgEnv.ServerPort],
			[SemanticAttributes.HTTP_USER_AGENT]: req.headers['user-agent'],
			[SemanticAttributes.HTTP_REQUEST_CONTENT_LENGTH]: req.headers['content-length'],
			[SemanticAttributes.HTTP_SCHEME]: req.protocol === 'https' ? 'https' : 'http',
		});
	});

	fastify.addHook('onResponse', async (req, resp) => {
		if (req.telemetry) {
			req.telemetry.parentSpan.setAttributes({
				[SemanticAttributes.HTTP_STATUS_CODE]: resp.statusCode,
				[SemanticAttributes.HTTP_RESPONSE_CONTENT_LENGTH]: resp.getHeader('content-length'),
			});
			setStatus(req.telemetry.parentSpan, resp.statusCode);
			req.telemetry.parentSpan.end();
		}
	});

	fastify.addHook('onError', async (req, resp, err) => {
		if (req.telemetry) {
			req.telemetry.parentSpan.setStatus({
				message: err.message,
				code: SpanStatusCode.ERROR,
			});
			req.telemetry.parentSpan.setAttributes({
				[SemanticAttributes.HTTP_STATUS_CODE]: err.message,
				'error.stack': err.stack,
				'error.name': err.name,
			});
		}
	});

	fastify.addHook('onClose', async () => {
		await options.provider.forceFlush();
		await options.provider.shutdown();
	});
};

export default fp(FastifyTelemetryPlugin);
