import { FastifyPluginAsync } from 'fastify';
import { Context, propagation, ROOT_CONTEXT, Span, SpanKind, trace, Tracer } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import fp from 'fastify-plugin';
import { FastifyRequestContext } from '../types';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { attachErrorToSpan, setStatusFromResponseCode } from '../trace/util';
import { Attributes, Components } from '../trace/attributes';
import uri, { URIComponent } from 'fast-uri';

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
	serverInfo: {
		host: string;
		port: number;
	};
}

const FastifyTelemetryPlugin: FastifyPluginAsync<TelemetryPluginOptions> = async (fastify, options) => {
	const tracer = options.provider.getTracer('hook-server', '0.0.1');

	fastify.decorate<Tracer>('tracer', tracer);

	const filter = (url: URIComponent): boolean => {
		return url.path === '/health' || url.path === '/favicon.ico';
	};

	fastify.addHook('onRequest', async (req, resp) => {
		const url = uri.parse(req.url);

		if (filter(url)) {
			return;
		}

		const activeContext = propagation.extract(ROOT_CONTEXT, req.headers);
		const span = tracer.startSpan(
			`${req.method} ${req.routerPath}`,
			{ startTime: performance.now(), kind: SpanKind.SERVER },
			activeContext
		);

		// Overwrite decorator per request to ensure encapsulation
		req.telemetry = {
			parentSpan: span,
			context: trace.setSpan(activeContext, span),
		};

		req.telemetry.parentSpan.setAttributes({
			[Attributes.WG_COMPONENT_NAME]: Components.HOOKS_SERVER,
			[SemanticAttributes.HTTP_FLAVOR]: req.raw.httpVersion,
			[SemanticAttributes.HTTP_METHOD]: req.raw.method,
			[SemanticAttributes.HTTP_ROUTE]: req.routerPath,
			[SemanticAttributes.HTTP_TARGET]: req.url,
			[SemanticAttributes.NET_PEER_NAME]: options.serverInfo.host,
			[SemanticAttributes.NET_PEER_PORT]: options.serverInfo.port,
			[SemanticAttributes.HTTP_USER_AGENT]: req.headers['user-agent'],
			[SemanticAttributes.HTTP_REQUEST_CONTENT_LENGTH]: req.headers['content-length'],
			[SemanticAttributes.HTTP_SCHEME]: req.protocol,
		});
	});

	fastify.addHook('onResponse', async (req, resp) => {
		if (req.telemetry) {
			req.telemetry.parentSpan.setAttributes({
				[SemanticAttributes.HTTP_STATUS_CODE]: resp.statusCode,
				[SemanticAttributes.HTTP_RESPONSE_CONTENT_LENGTH]: resp.getHeader('content-length'),
			});
			setStatusFromResponseCode(req.telemetry.parentSpan, resp.statusCode);
			req.telemetry.parentSpan.end();
		}
	});

	fastify.addHook('onError', async (req, resp, err) => {
		if (req.telemetry) {
			attachErrorToSpan(req.telemetry.parentSpan, err);
		}
	});

	fastify.addHook('onClose', async () => {
		await options.provider.forceFlush();
		await options.provider.shutdown();
	});
};

export default fp(FastifyTelemetryPlugin);
