import { ConfigurationVariable } from '@wundergraph/protobuf';
import {
	EnvironmentVariable,
	InputVariable,
	mapInputVariable,
	resolveConfigurationVariable,
	resolveVariable,
} from './variables';

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
	ProxyUrl = 'WG_PROXY_URL',
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
	nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, `http://${defaultHost}:${defaultNodePort}`),
	publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, `http://${defaultHost}:${defaultNodePort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
	},
	defaultRequestTimeoutSeconds: 0,
	defaultHttpProxyUrl: new EnvironmentVariable(WgEnv.ProxyUrl, ''),
};

export interface ListenOptions {
	host?: InputVariable;
	port?: InputVariable;
}

export interface ResolvedListenOptions {
	host: ConfigurationVariable;
	port: ConfigurationVariable;
}

export interface NodeOptions {
	nodeUrl?: InputVariable;
	publicNodeUrl?: InputVariable;
	listen?: ListenOptions;
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
	/** Default HTTP(S) proxy to use
	 *
	 * @defaultValue undefined (no proxy)
	 */
	defaultHttpProxyUrl?: InputVariable;
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	publicNodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: {
		level: ConfigurationVariable;
	};
	defaultRequestTimeoutSeconds: number;
	defaultHttpProxyUrl: ConfigurationVariable;
}

export const fallbackNodeUrl = (listenOptions: ListenOptions | undefined) => {
	let port = listenOptions?.port || DefaultNodeOptions.listen.port;
	let host = listenOptions?.host || DefaultNodeOptions.listen.host;

	return `http://${resolveVariable(host)}:${resolveVariable(port)}`;
};

export const resolveNodeOptions = (options?: NodeOptions): ResolvedNodeOptions => {
	let nodeOptions = isCloud
		? DefaultNodeOptions
		: {
				nodeUrl: options?.nodeUrl || new EnvironmentVariable(WgEnv.NodeUrl, fallbackNodeUrl(options?.listen)),
				publicNodeUrl:
					options?.publicNodeUrl || new EnvironmentVariable(WgEnv.NodeUrl, fallbackNodeUrl(options?.listen)),
				listen: {
					host: options?.listen?.host || DefaultNodeOptions.listen.host,
					port: options?.listen?.port || DefaultNodeOptions.listen.port,
				},
				logger: {
					level: options?.logger?.level || DefaultNodeOptions.logger.level,
				},
				defaultRequestTimeoutSeconds:
					options?.defaultRequestTimeoutSeconds || DefaultNodeOptions.defaultRequestTimeoutSeconds,
				defaultHttpProxyUrl: options?.defaultHttpProxyUrl || DefaultNodeOptions.defaultHttpProxyUrl,
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
		defaultRequestTimeoutSeconds: nodeOptions.defaultRequestTimeoutSeconds,
		defaultHttpProxyUrl: mapInputVariable(nodeOptions.defaultHttpProxyUrl),
	};
};
