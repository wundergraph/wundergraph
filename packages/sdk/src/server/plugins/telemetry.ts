import { FastifyPluginAsync } from 'fastify';
import { TelemetryTracerProvider } from '../trace';
import { context, propagation, Span, SpanStatusCode, trace, Context } from '@opentelemetry/api';
import fp from 'fastify-plugin';

const FastifyTelemetryPlugin: FastifyPluginAsync<TelemetryTracerProvider> = async (fastify, options) => {
	const contextMap = new WeakMap();
	const tracer = options.provider.getTracer('hook-server', '0.0.1');

	fastify.addHook('onRequest', async (req, resp) => {
		let activeContext = context.active();

		if (!trace.getSpan(activeContext)) {
			activeContext = propagation.extract(activeContext, req.headers);
		}

		const span = tracer.startSpan(`${req.method} ${req.url}`, { startTime: performance.now() }, activeContext);
		span.setAttributes({
			'http.method': req.raw.method,
			'http.url': req.raw.url,
		});

		contextMap.set(req, trace.setSpan(activeContext, span));
	});

	fastify.addHook('onResponse', async (req, resp) => {
		const activeContext = contextMap.get(req) || context.active();
		const span = trace.getSpan(activeContext);
		const spanStatus = { code: SpanStatusCode.OK };

		if (resp.statusCode >= 500) {
			spanStatus.code = SpanStatusCode.ERROR;
		}

		span!.setAttributes({
			'http.status_code': resp.statusCode,
		});

		span!.setStatus(spanStatus);
		span!.end();

		contextMap.delete(req);
	});

	fastify.addHook('onError', async (req, resp, err) => {
		const activeContext = contextMap.get(req) || context.active();
		const span = trace.getSpan(activeContext);

		span!.setAttributes({
			'error.message': err.message,
			'error.stack': err.stack,
			'error.name': err.name,
		});
	});

	fastify.decorateRequest('telemetry', function () {
		const req = this;
		return {
			get span(): Span {
				const activeContext = contextMap.get(req) || context.active();

				return trace.getSpan(activeContext)!;
			},
			get context(): Context {
				return contextMap.get(req) || context.active();
			},
		};
	});
};

export default fp(FastifyTelemetryPlugin);
