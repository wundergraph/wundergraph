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
	NodeInternalUrl = 'WG_NODE_INTERNAL_URL',
	NodeHost = 'WG_NODE_HOST',
	NodePort = 'WG_NODE_PORT',
	NodeInternalPort = 'WG_NODE_INTERNAL_PORT',
	ServerUrl = 'WG_SERVER_URL',
	ServerHost = 'WG_SERVER_HOST',
	ServerPort = 'WG_SERVER_PORT',
	HttpProxyUrl = 'WG_HTTP_PROXY',
}

export type LoggerLevel = 'fatal' | 'panic' | 'warning' | 'error' | 'info' | 'debug';

export const defaultHost = 'localhost';
export const defaultNodePort = '9991';
export const defaultNodeInternalPort = '9993';
export const defaultServerPort = '9992';

const DefaultNodeOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.NodeHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.NodePort, defaultNodePort),
	},
	listenInternal: {
		port: new EnvironmentVariable(WgEnv.NodeInternalPort, defaultNodeInternalPort),
	},
	nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, `http://${defaultHost}:${defaultNodePort}`),
	nodeInternalUrl: new EnvironmentVariable(WgEnv.NodeInternalUrl, `http://${defaultHost}:${defaultNodeInternalPort}`),
	publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, `http://${defaultHost}:${defaultNodePort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
	},
	defaultRequestTimeoutSeconds: 0,
	defaultHttpProxyUrl: new EnvironmentVariable(WgEnv.HttpProxyUrl, ''),
};

export interface ListenOptions {
	host?: InputVariable;
	port?: InputVariable;
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
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	nodeInternalUrl: ConfigurationVariable;
	publicNodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	listenInternal: ResolvedListenInternalOptions;
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
				defaultRequestTimeoutSeconds:
					options?.defaultRequestTimeoutSeconds || DefaultNodeOptions.defaultRequestTimeoutSeconds,
				defaultHttpProxyUrl: options?.defaultHttpProxyUrl || DefaultNodeOptions.defaultHttpProxyUrl,
		  };

	return {
		nodeUrl: mapInputVariable(nodeOptions.nodeUrl),
		nodeInternalUrl: mapInputVariable(nodeOptions.nodeInternalUrl),
		publicNodeUrl: mapInputVariable(nodeOptions.publicNodeUrl),
		listen: {
			host: mapInputVariable(nodeOptions.listen.host),
			port: mapInputVariable(nodeOptions.listen.port),
		},
		listenInternal: {
			port: mapInputVariable(nodeOptions.listenInternal.port),
		},
		logger: {
			level: mapInputVariable(nodeOptions.logger.level),
		},
		defaultRequestTimeoutSeconds: nodeOptions.defaultRequestTimeoutSeconds,
		defaultHttpProxyUrl: mapInputVariable(nodeOptions.defaultHttpProxyUrl),
	};
};
