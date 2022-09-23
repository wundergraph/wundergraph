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

const DefaultNodeOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.NodeHost, '127.0.0.1'),
		port: new EnvironmentVariable(WgEnv.NodePort, '9991'),
	},
	nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, 'http://localhost:9991'),
	publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, 'http://localhost:9991'),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'INFO'),
	},
};

const DefaultServerOptions: MandatoryServerOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.ServerHost, '127.0.0.1'),
		port: new EnvironmentVariable(WgEnv.ServerPort, '9992'),
	},
	serverUrl: new EnvironmentVariable(WgEnv.ServerUrl, 'http://localhost:9992'),
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
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	publicNodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: {
		level: ConfigurationVariable;
	};
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

export const resolveNodeOptions = (options?: NodeOptions): ResolvedNodeOptions => {
	const fallbackNodeUrl = options?.listen?.port
		? new EnvironmentVariable(WgEnv.NodeUrl, `http://localhost:${options?.listen?.port}`)
		: DefaultNodeOptions.nodeUrl;

	const fallbackPublicNodeUrl = options?.listen?.port
		? new EnvironmentVariable(WgEnv.PublicNodeUrl, `http://localhost:${options?.listen?.port}`)
		: DefaultNodeOptions.publicNodeUrl;

	let nodeOptions = isCloud
		? DefaultNodeOptions
		: {
				nodeUrl: options?.nodeUrl || fallbackNodeUrl,
				publicNodeUrl: options?.publicNodeUrl || fallbackPublicNodeUrl,
				listen: {
					host: options?.listen?.host || DefaultNodeOptions.listen.host,
					port: options?.listen?.port || DefaultNodeOptions.listen.port,
				},
				logger: {
					level: options?.logger?.level || DefaultNodeOptions.logger.level,
				},
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
	};
};

export const serverOptionsWithDefaults = (options?: ServerOptions): MandatoryServerOptions => {
	const fallbackServerUrl = options?.listen?.port
		? new EnvironmentVariable(WgEnv.ServerUrl, `http://localhost:${options?.listen?.port}`)
		: DefaultServerOptions.serverUrl;

	return isCloud
		? DefaultServerOptions
		: {
				serverUrl: options?.serverUrl || fallbackServerUrl,
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
