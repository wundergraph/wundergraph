import { EnvironmentVariable, mapInputVariable, resolveVariable } from '../configure/variables';
import { defaultHost, defaultServerPort, isCloud, ListenOptions, LoggerLevel, WgEnv } from '../configure/options';
import { ResolvedServerOptions, ServerOptions, MandatoryServerOptions, WunderGraphHooksAndServerConfig } from './types';

export const customGqlServerMountPath = (name: string): string => {
	return `/gqls/${name}/graphql`;
};

const DefaultServerOptions: MandatoryServerOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.ServerHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.ServerPort, defaultServerPort),
	},
	serverUrl: new EnvironmentVariable(WgEnv.ServerUrl, `http://${defaultHost}:${defaultServerPort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
	},
};

export const fallbackServerUrl = (listenOptions: ListenOptions | undefined) => {
	let port = listenOptions?.port || DefaultServerOptions.listen.port;
	let host = listenOptions?.host || DefaultServerOptions.listen.host;

	return `http://${resolveVariable(host)}:${resolveVariable(port)}`;
};

export const serverOptionsWithDefaults = (options?: ServerOptions): MandatoryServerOptions => {
	return isCloud
		? DefaultServerOptions
		: {
				serverUrl: options?.serverUrl || new EnvironmentVariable(WgEnv.ServerUrl, fallbackServerUrl(options?.listen)),
				listen: {
					host: options?.listen?.host || DefaultServerOptions.listen.host,
					port: options?.listen?.port || DefaultServerOptions.listen.port,
				},
				logger: {
					level: options?.logger?.level || DefaultServerOptions.logger.level,
				},
		  };
};

export const resolveServerOptions = (
	options: MandatoryServerOptions,
	server?: WunderGraphHooksAndServerConfig
): ResolvedServerOptions => {
	return {
		present: server !== undefined,
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
