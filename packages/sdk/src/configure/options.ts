import { ConfigurationVariable } from '@wundergraph/protobuf';
import { EnvironmentVariable, InputVariable, mapInputVariable, resolveVariable } from './variables';

export const isCloud = process.env.WG_CLOUD === 'true';

export enum WgEnv {
	LogLevel = 'WG_LOG_LEVEL',
	NodeUrl = 'WG_NODE_URL',
	PublicNodeUrl = 'WG_PUBLIC_NODE_URL',
	NodeInternalUrl = 'WG_NODE_INTERNAL_URL',
	NodeHost = 'WG_NODE_HOST',
	NodePort = 'WG_NODE_PORT',
	NodeInternalPort = 'WG_NODE_INTERNAL_PORT',
	ServerUrl = 'WG_SERVER_URL',
	ServerHost = 'WG_SERVER_HOST',
	ServerPort = 'WG_SERVER_PORT',
	HttpProxyUrl = 'WG_HTTP_PROXY',
	PrometheusEnabled = 'WG_PROMETHEUS_ENABLED',
	PrometheusPort = 'WG_PROMETHEUS_PORT',
	OtelEnabled = 'WG_OTEL_ENABLED',
	OtelExporterHttpEndpoint = 'WG_OTEL_EXPORTER_HTTP_ENDPOINT',
	OtelSampler = 'WG_OTEL_SAMPLER',
	OtelAuthToken = 'WG_OTEL_AUTH_TOKEN',
	OtelBatchTimeoutMs = 'WG_OTEL_BATCH_TIMEOUT_MS',
}

export type LoggerLevel = 'fatal' | 'panic' | 'warning' | 'error' | 'info' | 'debug';

export const defaultHost = 'localhost';
export const defaultNodePort = '9991';
export const defaultNodeInternalPort = '9993';
export const defaultServerPort = '9992';
export const defaultPrometheusEnabled = false;
export const defaultPrometheusPort = 8881;

const DefaultNodeOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.NodeHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.NodePort, defaultNodePort),
	},
	listenInternal: {
		port: new EnvironmentVariable(WgEnv.NodeInternalPort, defaultNodeInternalPort),
	},
	openTelemetry: {
		enabled: new EnvironmentVariable<boolean>(WgEnv.OtelEnabled, false),
		exporterHttpEndpoint: new EnvironmentVariable(WgEnv.OtelExporterHttpEndpoint, 'http://localhost:4318'),
		sampler: new EnvironmentVariable(WgEnv.OtelSampler, '1.0'),
		authToken: new EnvironmentVariable(WgEnv.OtelAuthToken, ''),
	},
	nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, `http://${defaultHost}:${defaultNodePort}`),
	nodeInternalUrl: new EnvironmentVariable(WgEnv.NodeInternalUrl, `http://${defaultHost}:${defaultNodeInternalPort}`),
	publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, `http://${defaultHost}:${defaultNodePort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
	},
	defaultRequestTimeoutSeconds: 0,
	defaultHttpProxyUrl: new EnvironmentVariable(WgEnv.HttpProxyUrl, ''),
	prometheus: {
		enabled: new EnvironmentVariable(WgEnv.PrometheusEnabled, defaultPrometheusEnabled),
		port: new EnvironmentVariable(WgEnv.PrometheusPort, defaultPrometheusPort),
	},
};

export interface ListenOptions {
	host?: InputVariable;
	port?: InputVariable;
}

export interface TelemetryOptions {
	/**
	 * Enable OpenTelemetry tracing.
	 * Defaults to `false`.
	 */
	enabled: InputVariable<boolean>;
	/**
	 * OpenTelemetry exporter HTTP endpoint.
	 * Defaults to `http://localhost:4318`.
	 * We only support v1 of the OpenTelemetry protocol.
	 */
	exporterHttpEndpoint?: InputVariable;
	/**
	 * OpenTelemetry sampler.
	 * Defaults to `1.0` (always sample).
	 * The value must be a number between 0 and 1. 0 means never sample, 1 means always sample.
	 */
	sampler?: InputVariable<number>;
	/**
	 * OpenTelemetry JWT token.
	 * Attach this token to every request in form of a Bearer token.
	 */
	authToken?: InputVariable;
}

export interface ResolvedTelemetryOptions {
	enabled: ConfigurationVariable;
	exporterHttpEndpoint: ConfigurationVariable;
	sampler: ConfigurationVariable;
	authToken: ConfigurationVariable;
}

export interface ListenInternalOptions extends Omit<ListenOptions, 'host'> {}

export interface ResolvedListenOptions {
	host: ConfigurationVariable;
	port: ConfigurationVariable;
}

export interface ResolvedListenInternalOptions extends Omit<ResolvedListenOptions, 'host'> {}

export interface NodeOptions {
	nodeUrl?: InputVariable;
	publicNodeUrl?: InputVariable;
	listen?: ListenOptions;
	listenInternal?: ListenInternalOptions;
	openTelemetry?: TelemetryOptions;
	logger?: {
		level?: InputVariable<LoggerLevel>;
	};
	/**
	 * Default timeout for network requests, in seconds.
	 *
	 * @remarks
	 * See {@link IntrospectionConfiguration | the IntrospectionConfiguration type}
	 * for data source specific timeouts.
	 *
	 * @defaultValue 10 seconds
	 */
	defaultRequestTimeoutSeconds?: number;
	/** Default HTTP(S) proxy to use. Data sources that support proxies might also
	 * override the default proxy with a more specific one.
	 *
	 * @defaultValue Use the WG_HTTP_PROXY environment variable
	 */
	defaultHttpProxyUrl?: InputVariable;

	/**
	 * Options for exposing metrics via Prometheus
	 **/
	prometheus?: {
		/** Whether to enable Prometheus metrics collection and exposure */
		enabled?: InputVariable<boolean>;
		/**
		 * Port to listen on for exposing metrics via Prometheus. The endpoint
		 * is available at http://<host>:port/metrics. Set to zero to disable.
		 */
		port?: InputVariable<number>;
	};
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	nodeInternalUrl: ConfigurationVariable;
	publicNodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	listenInternal: ResolvedListenInternalOptions;
	openTelemetry: ResolvedTelemetryOptions;
	logger: {
		level: ConfigurationVariable;
	};
	defaultRequestTimeoutSeconds: number;
	defaultHttpProxyUrl: ConfigurationVariable;
	prometheus: {
		enabled: ConfigurationVariable;
		port: ConfigurationVariable;
	};
}

export const fallbackNodeUrl = (listenOptions: ListenOptions | undefined) => {
	let port = listenOptions?.port || DefaultNodeOptions.listen.port;
	let host = listenOptions?.host || DefaultNodeOptions.listen.host;

	return `http://${resolveVariable(host)}:${resolveVariable(port)}`;
};

export const fallbackNodeInternalUrl = (options?: NodeOptions) => {
	let port = options?.listenInternal?.port || DefaultNodeOptions.listenInternal.port;
	let host = options?.listen?.host || DefaultNodeOptions.listen.host;

	return `http://${resolveVariable(host)}:${resolveVariable(port)}`;
};

export const resolveNodeOptions = (options?: NodeOptions): ResolvedNodeOptions => {
	let nodeOptions = isCloud
		? DefaultNodeOptions
		: {
				nodeUrl: options?.nodeUrl || new EnvironmentVariable(WgEnv.NodeUrl, fallbackNodeUrl(options?.listen)),
				nodeInternalUrl: new EnvironmentVariable(WgEnv.NodeInternalUrl, fallbackNodeInternalUrl(options)),
				publicNodeUrl:
					options?.publicNodeUrl || new EnvironmentVariable(WgEnv.PublicNodeUrl, fallbackNodeUrl(options?.listen)),
				listen: {
					host: options?.listen?.host || DefaultNodeOptions.listen.host,
					port: options?.listen?.port || DefaultNodeOptions.listen.port,
				},
				listenInternal: {
					port: options?.listenInternal?.port || DefaultNodeOptions.listenInternal.port,
				},
				logger: {
					level: options?.logger?.level || DefaultNodeOptions.logger.level,
				},
				openTelemetry: {
					enabled: options?.openTelemetry?.enabled || DefaultNodeOptions.openTelemetry.enabled,
					sampler: options?.openTelemetry?.sampler || DefaultNodeOptions.openTelemetry.sampler,
					exporterHttpEndpoint:
						options?.openTelemetry?.exporterHttpEndpoint || DefaultNodeOptions.openTelemetry.exporterHttpEndpoint,
					authToken: options?.openTelemetry?.authToken || DefaultNodeOptions.openTelemetry.authToken,
				},
				defaultRequestTimeoutSeconds:
					options?.defaultRequestTimeoutSeconds || DefaultNodeOptions.defaultRequestTimeoutSeconds,
				defaultHttpProxyUrl: options?.defaultHttpProxyUrl || DefaultNodeOptions.defaultHttpProxyUrl,
				prometheus: {
					enabled: options?.prometheus?.enabled || DefaultNodeOptions.prometheus.enabled,
					port: options?.prometheus?.port || DefaultNodeOptions.prometheus.port,
				},
		  };

	return {
		nodeUrl: mapInputVariable(nodeOptions.nodeUrl),
		nodeInternalUrl: mapInputVariable(nodeOptions.nodeInternalUrl),
		publicNodeUrl: mapInputVariable(nodeOptions.publicNodeUrl),
		listen: {
			host: mapInputVariable(nodeOptions.listen.host),
			port: mapInputVariable(nodeOptions.listen.port),
		},
		openTelemetry: {
			enabled: mapInputVariable(nodeOptions.openTelemetry.enabled),
			exporterHttpEndpoint: mapInputVariable(nodeOptions.openTelemetry.exporterHttpEndpoint),
			sampler: mapInputVariable<number | string>(nodeOptions.openTelemetry.sampler),
			authToken: mapInputVariable(nodeOptions.openTelemetry?.authToken),
		},
		listenInternal: {
			port: mapInputVariable(nodeOptions.listenInternal.port),
		},
		logger: {
			level: mapInputVariable(nodeOptions.logger.level),
		},
		defaultRequestTimeoutSeconds: nodeOptions.defaultRequestTimeoutSeconds,
		defaultHttpProxyUrl: mapInputVariable(nodeOptions.defaultHttpProxyUrl),
		prometheus: {
			enabled: mapInputVariable(nodeOptions.prometheus.enabled),
			port: mapInputVariable(nodeOptions.prometheus.port),
		},
	};
};
