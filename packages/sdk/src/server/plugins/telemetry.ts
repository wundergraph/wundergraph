import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';
import { TelemetryTracerProvider } from '../trace';
import { context, propagation, Span, SpanStatusCode, trace } from '@opentelemetry/api';
import fp from 'fastify-plugin';

const FastifyTelemetryPlugin: FastifyPluginAsync<TelemetryTracerProvider> = async (fastify, options) => {
	const contextMap = new WeakMap();
	const tracer = trace.getTracer('hook-server', '0.0.1');

	fastify.addHook('onRequest', async (req, resp) => {
		let activeContext = context.active();

		if (!trace.getSpan(activeContext)) {
			activeContext = propagation.extract(activeContext, req.headers);
		}

		//const t = process.hrtime();
		const span = tracer.startSpan(`${req.method} ${req.url}`, {}, activeContext);
		span.setAttributes({
			'http.method': req.raw.method,
			'http.url': req.raw.url,
		});
		//fastify.log.debug(`Starting span time ----> ${t}`);

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
		};
	});
};

export default fp(FastifyTelemetryPlugin);
