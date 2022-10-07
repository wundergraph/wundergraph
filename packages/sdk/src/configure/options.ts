import { ConfigurationVariable } from '@wundergraph/protobuf';
import { EnvironmentVariable, InputVariable, mapInputVariable } from './variables';

const isCloud = process.env.WG_CLOUD === 'true';

export enum WgEnv {
	LogLevel = 'WG_LOG_LEVEL',
	NodeUrl = 'WG_NODE_URL',
	PublicNodeUrl = 'WG_PUBLIC_NODE_URL',
	NodeHost = 'WG_NODE_HOST',
	NodePort = 'WG_NODE_PORT',
	ServerUrl = 'WG_SERVER_URL',
	ServerHost = 'WG_SERVER_HOST',
	ServerPort = 'WG_SERVER_PORT',
}

export type LoggerLevel = 'FATAL' | 'PANIC' | 'WARNING' | 'ERROR' | 'INFO' | 'DEBUG';

const defaultHost = '127.0.0.1';
const defaultNodePort = '9991';
const defaultServerPort = '9992';

const DefaultNodeOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.NodeHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.NodePort, defaultNodePort),
	},
	nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, `http://localhost:${defaultNodePort}`),
	publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, `http://localhost:${defaultNodePort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'INFO'),
	},
	defaultRequestTimeoutMilliseconds: 0,
};

const DefaultServerOptions: MandatoryServerOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.ServerHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.ServerPort, defaultServerPort),
	},
	serverUrl: new EnvironmentVariable(WgEnv.ServerUrl, `http://localhost:${defaultServerPort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'INFO'),
	},
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
	defaultRequestTimeoutMilliseconds?: number;
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	publicNodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: {
		level: ConfigurationVariable;
	};
	defaultRequestTimeoutMilliseconds: number;
}

export interface ServerOptions {
	serverUrl?: InputVariable;
	listen?: ListenOptions;
	logger?: ServerLogger;
}

export interface MandatoryServerOptions {
	serverUrl: InputVariable;
	listen: {
		host: InputVariable;
		port: InputVariable;
	};
	logger: {
		level: InputVariable<LoggerLevel>;
	};
}

export interface ResolvedServerOptions {
	serverUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: ResolvedServerLogger;
}

export interface ServerLogger {
	level?: InputVariable<LoggerLevel>;
}

export interface ResolvedServerLogger {
	level: ConfigurationVariable;
}

const fallbackUrl = (defaultPort: string, listen?: ListenOptions) => {
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
				defaultRequestTimeoutMilliseconds:
					options?.defaultRequestTimeoutMilliseconds || DefaultNodeOptions?.defaultRequestTimeoutMilliseconds,
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
		defaultRequestTimeoutMilliseconds: nodeOptions.defaultRequestTimeoutMilliseconds,
	};
};

export const serverOptionsWithDefaults = (options?: ServerOptions): MandatoryServerOptions => {
	return isCloud
		? DefaultServerOptions
		: {
				serverUrl:
					options?.serverUrl ||
					new EnvironmentVariable(WgEnv.ServerUrl, fallbackUrl(defaultServerPort, options?.listen)),
				listen: {
					host: options?.listen?.host || DefaultServerOptions.listen.host,
					port: options?.listen?.port || DefaultServerOptions.listen.port,
				},
				logger: {
					level: options?.logger?.level || DefaultServerOptions.logger.level,
				},
		  };
};

export const resolveServerOptions = (options: MandatoryServerOptions): ResolvedServerOptions => {
	return {
		serverUrl: mapInputVariable(options.serverUrl),
		listen: {
			host: mapInputVariable(options.listen.host),
			port: mapInputVariable(options.listen.port),
		},
		logger: {
			level: mapInputVariable(options.logger.level),
		},
	};
};
