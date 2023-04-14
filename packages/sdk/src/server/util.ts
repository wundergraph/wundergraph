import { EnvironmentVariable, mapInputVariable } from '../configure/variables';
import { defaultHost, defaultServerPort, fallbackServerUrl, isCloud, LoggerLevel, WgEnv } from '../configure/options';
import { ResolvedServerOptions, ServerOptions, MandatoryServerOptions } from './types';

export const customGqlServerMountPath = (name: string): string => {
	return `/gqls/${name}/graphql`;
};

const DefaultServerOptions: MandatoryServerOptions = {
	listen: {
		host: new EnvironmentVariable(WgEnv.ServerHost, defaultHost),
		port: new EnvironmentVariable(WgEnv.ServerPort, defaultServerPort),
	},
	serverUrl: new EnvironmentVariable(WgEnv.ServerUrl, `http://localhost:${defaultServerPort}`),
	logger: {
		level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
	},
};

export const serverOptionsWithDefaults = (options?: ServerOptions): MandatoryServerOptions => {
	return isCloud
		? DefaultServerOptions
		: {
				serverUrl: options?.serverUrl || fallbackServerUrl(options?.listen),
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
