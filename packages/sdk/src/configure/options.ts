import { EnvironmentVariable, InputVariable, mapInputVariable, resolveConfigurationVariable } from './index';
import { ConfigurationVariable, LogLevel, logLevelFromJSON } from '@wundergraph/protobuf';

export enum WgEnv {
	LogLevel = 'WG_LOG_LEVEL',
	NodeUrl = 'WG_NODE_URL',
	NodeHost = 'WG_NODE_HOST',
	NodePort = 'WG_NODE_PORT',
	ServerUrl = 'WG_SERVER_URL',
	ServerHost = 'WG_SERVER_HOST',
	ServerPort = 'WG_SERVER_PORT',
}

export interface ListenOptions {
	host?: InputVariable;
	port?: InputVariable;
}

export interface MandatoryListenOptions {
	host: InputVariable;
	port: InputVariable;
}

export interface ResolvedListenOptions {
	host: ConfigurationVariable;
	port: ConfigurationVariable;
}

export interface NodeOptions {
	nodeUrl?: InputVariable;
	listen?: ListenOptions;
	logger?: NodeLogger;
}

export interface ResolvedNodeOptions {
	nodeUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: ResolvedNodeLogger;
}

export interface NodeLogger {
	level?: InputVariable;
}

export interface ResolvedNodeLogger {
	level: LogLevel;
}

export interface ServerOptions {
	serverUrl?: InputVariable;
	listen?: ListenOptions;
	logger?: ServerLogger;
}

export interface MandatoryServerOptions {
	serverUrl: InputVariable;
	listen: MandatoryListenOptions;
	logger: MandatoryServerLogger;
}

export interface ResolvedServerOptions {
	serverUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: ResolvedServerLogger;
}

export interface ServerLogger {
	level?: InputVariable;
}

export interface MandatoryServerLogger {
	level: InputVariable;
}

type PinoLogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug'; // 'trace' | 'silent'

export interface ResolvedServerLogger {
	level: PinoLogLevel;
}

const resolveLogLevel = (level: ConfigurationVariable): LogLevel => {
	const stringLevel = resolveConfigurationVariable(level);

	return logLevelFromJSON(stringLevel);
};

const resolveServerLogLevel = (level: ConfigurationVariable): PinoLogLevel => {
	const wgLogLevel = resolveLogLevel(level);
	switch (wgLogLevel) {
		case LogLevel.FATAL:
			return 'fatal';
		case LogLevel.PANIC:
			return 'fatal';
		case LogLevel.WARNING:
			return 'warn';
		case LogLevel.ERROR:
			return 'error';
		case LogLevel.INFO:
			return 'info';
		case LogLevel.DEBUG:
			return 'debug';
	}
};

export const resolveNodeOptionsWithDefaults = (options?: NodeOptions): ResolvedNodeOptions => {
	if (!options) {
		options = {};
	}

	if (!options.nodeUrl) {
		options.nodeUrl = new EnvironmentVariable(WgEnv.NodeUrl, 'http://localhost:9991');
	}

	if (!options.listen) {
		options.listen = {};
	}

	if (!options.listen.host) {
		options.listen.host = new EnvironmentVariable(WgEnv.NodeHost, '127.0.0.1');
	}

	if (!options.listen.port) {
		options.listen.port = new EnvironmentVariable(WgEnv.NodePort, '9991');
	}

	if (!options.logger) {
		options.logger = {};
	}

	if (!options.logger.level) {
		options.logger.level = new EnvironmentVariable(WgEnv.LogLevel, 'WARNING');
	}

	return {
		nodeUrl: mapInputVariable(options.nodeUrl),
		listen: {
			host: mapInputVariable(options.listen.host),
			port: mapInputVariable(options.listen.port),
		},
		logger: {
			level: resolveLogLevel(mapInputVariable(options.logger.level)),
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
			level: resolveServerLogLevel(mapInputVariable(options.logger.level)),
		},
	};
};

export const serverOptionsWithDefaults = (options?: ServerOptions): MandatoryServerOptions => {
	if (!options) {
		options = {};
	}

	if (!options.serverUrl) {
		options.serverUrl = new EnvironmentVariable(WgEnv.ServerUrl, 'http://localhost:9992');
	}

	if (!options.listen) {
		options.listen = {};
	}

	if (!options.listen.host) {
		options.listen.host = new EnvironmentVariable(WgEnv.ServerHost, '127.0.0.1');
	}

	if (!options.listen.port) {
		options.listen.port = new EnvironmentVariable(WgEnv.ServerPort, '9992');
	}

	if (!options.logger) {
		options.logger = {};
	}

	if (!options.logger.level) {
		options.logger.level = new EnvironmentVariable(WgEnv.LogLevel, 'WARNING');
	}

	return {
		serverUrl: options.serverUrl,
		listen: {
			host: options.listen.host,
			port: options.listen.port,
		},
		logger: {
			level: options.logger.level,
		},
	};
};
