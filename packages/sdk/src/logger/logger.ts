import { ConfigurationVariable, LogLevel, logLevelFromJSON, WgEnvironmentVariable } from '@wundergraph/protobuf';
import { resolveConfigurationVariable } from '../configure/variables';
import { pino } from 'pino';
import pretty from 'pino-pretty';
import { WgEnvValue } from '../env/env';

export enum PinoLogLevel {
	Fatal = 'fatal',
	Error = 'error',
	Warn = 'warn',
	Info = 'info',
	Debug = 'debug',
	Trace = 'trace',
	Silent = 'silent',
}

export const resolveServerLogLevel = (level: ConfigurationVariable): PinoLogLevel => {
	const stringLevel = resolveConfigurationVariable(level);
	const wgLogLevel = logLevelFromJSON(stringLevel);
	switch (wgLogLevel) {
		case LogLevel.FATAL:
			return PinoLogLevel.Fatal;
		case LogLevel.PANIC:
			return PinoLogLevel.Fatal;
		case LogLevel.WARNING:
			return PinoLogLevel.Warn;
		case LogLevel.ERROR:
			return PinoLogLevel.Error;
		case LogLevel.INFO:
			return PinoLogLevel.Info;
		case LogLevel.DEBUG:
			return PinoLogLevel.Debug;
		default:
			throw new Error(`Unknown log level: ${wgLogLevel}`);
	}
};

let logger: pino.Logger | undefined;

export const Logger = (): pino.Logger => {
	if (logger) {
		return logger;
	}

	const enablePretty = WgEnvValue(WgEnvironmentVariable.WG_CLI_LOG_JSON) === 'false';

	let options: pino.LoggerOptions = {
		level: PinoLogLevel.Info,
		formatters: {
			level(label, number) {
				return { level: label };
			},
		},
	};

	if (enablePretty) {
		const stream = pretty({
			colorize: true,
			translateTime: "SYS:yyyy-mm-dd'T'HH:MM:ssp", // https://www.npmjs.com/package/dateformat
			customPrettifiers: {
				time: (timestamp) => `${timestamp}`,
			},
			ignore: 'pid,hostname',
			messageFormat: 'SDK: {msg}',
		});

		logger = pino(options, stream);
	} else {
		logger = pino(options);
	}

	return logger;
};

export const SetLogLevel = (level: PinoLogLevel) => {
	Logger().level = level;
};
