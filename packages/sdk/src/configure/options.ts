import { ConfigurationVariable } from '@wundergraph/protobuf';
import { EnvironmentVariable, InputVariable, mapInputVariable } from './variables';

export const isCloud = process.env.WG_CLOUD === 'true';

export enum WgEnv {
	LogLevel = 'WG_LOG_LEVEL',
	NodeUrl = 'WG_NODE_URL',
	PublicNodeUrl = 'WG_PUBLIC_NODE_URL',
	NodeHost = 'WG_NODE_HOST',
	NodePort = 'WG_NODE_PORT',
	ServerUrl = 'WG_SERVER_URL',
	ServerHost = 'WG_SERVER_HOST',
	ServerPort = 'WG_SERVER_PORT',
	OtelExporterHttpEndpoint = 'WG_OTEL_EXPORTER_HTTP_ENDPOINT',
	OtelExporterJaegerEndpoint = 'WG_OTEL_EXPORTER_JAEGER_ENDPOINT',
	OtelEnabled = 'WG_OTEL_ENABLED',
	OtelJwt = 'WG_OTEL_JWT',
}

export type LoggerLevel = 'fatal' | 'panic' | 'warning' | 'error' | 'info' | 'debug';

export const defaultHost = 'localhost';
export const defaultNodePort = '9991';
export const defaultServerPort = '9992';

const DefaultNodeOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.NodeHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.NodePort, defaultNodePort),
	},
	nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, `http://localhost:${defaultNodePort}`),
	publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, `http://localhost:${defaultNodePort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
	},
	openTelemetry: {
		enabled: new EnvironmentVariable<boolean>(WgEnv.OtelEnabled, false),
		exporterHttpEndpoint: new EnvironmentVariable(WgEnv.OtelExporterHttpEndpoint, ''),
		exporterJaegerEndpoint: new EnvironmentVariable(WgEnv.OtelExporterJaegerEndpoint, ''),
		authToken: new EnvironmentVariable(WgEnv.OtelJwt, ''),
	},
	defaultRequestTimeoutSeconds: 0,
};

export interface ListenOptions {
	host?: InputVariable;
	port?: InputVariable;
}

export interface ResolvedListenOptions {
	host: ConfigurationVariable;
	port: ConfigurationVariable;
}

export interface TelemetryOptions {
	enabled: InputVariable<boolean>;
	exporterHttpEndpoint?: InputVariable;
	exporterJaegerEndpoint?: InputVariable;
	authToken?: InputVariable;
}

export interface ResolvedTelemetryOptions {
	enabled: ConfigurationVariable;
	exporterHttpEndpoint: ConfigurationVariable;
	exporterJaegerEndpoint: ConfigurationVariable;
	authToken: ConfigurationVariable;
}

export interface NodeOptions {
	nodeUrl?: InputVariable;
	publicNodeUrl?: InputVariable;
	listen?: ListenOptions;
	logger?: {
		level?: InputVariable<LoggerLevel>;
	};
	openTelemetry?: TelemetryOptions;
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
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	publicNodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: {
		level: ConfigurationVariable;
	};
	openTelemetry: ResolvedTelemetryOptions;
	defaultRequestTimeoutSeconds: number;
}

export const fallbackUrl = (defaultPort: string, listen?: ListenOptions) => {
	return `http://${listen?.host || 'localhost'}:${listen?.port || defaultPort}`;
};

export const resolveNodeOptions = (options?: NodeOptions): ResolvedNodeOptions => {
	let nodeOptions = isCloud
		? DefaultNodeOptions
		: {
				nodeUrl:
					options?.nodeUrl || new EnvironmentVariable(WgEnv.NodeUrl, fallbackUrl(defaultNodePort, options?.listen)),
				publicNodeUrl:
					options?.publicNodeUrl ||
					new EnvironmentVariable(WgEnv.PublicNodeUrl, fallbackUrl(defaultNodePort, options?.listen)),
				listen: {
					host: options?.listen?.host || DefaultNodeOptions.listen.host,
					port: options?.listen?.port || DefaultNodeOptions.listen.port,
				},
				logger: {
					level: options?.logger?.level || DefaultNodeOptions.logger.level,
				},
				openTelemetry: {
					enabled: options?.openTelemetry?.enabled || DefaultNodeOptions.openTelemetry.enabled,
					exporterHttpEndpoint:
						options?.openTelemetry?.exporterHttpEndpoint || DefaultNodeOptions.openTelemetry.exporterHttpEndpoint,
					exporterJaegerEndpoint:
						options?.openTelemetry?.exporterJaegerEndpoint || DefaultNodeOptions.openTelemetry.exporterJaegerEndpoint,
					authToken: options?.openTelemetry?.authToken || DefaultNodeOptions.openTelemetry.authToken,
				},
				defaultRequestTimeoutSeconds:
					options?.defaultRequestTimeoutSeconds || DefaultNodeOptions?.defaultRequestTimeoutSeconds,
		  };

	return {
		nodeUrl: mapInputVariable(nodeOptions.nodeUrl),
		publicNodeUrl: mapInputVariable(nodeOptions.publicNodeUrl),
		listen: {
			host: mapInputVariable(nodeOptions.listen.host),
			port: mapInputVariable(nodeOptions.listen.port),
		},
		logger: {
			level: mapInputVariable(nodeOptions.logger.level),
		},
		openTelemetry: {
			enabled: mapInputVariable<boolean>(nodeOptions.openTelemetry.enabled),
			exporterHttpEndpoint: mapInputVariable(nodeOptions.openTelemetry.exporterHttpEndpoint),
			exporterJaegerEndpoint: mapInputVariable(nodeOptions.openTelemetry.exporterJaegerEndpoint),
			authToken: mapInputVariable(nodeOptions.openTelemetry?.authToken),
		},
		defaultRequestTimeoutSeconds: nodeOptions.defaultRequestTimeoutSeconds,
	};
};
