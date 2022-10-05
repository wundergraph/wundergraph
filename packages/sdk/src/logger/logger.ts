import { ConfigurationVariable, LogLevel, logLevelFromJSON } from '@wundergraph/protobuf';
import { resolveConfigurationVariable } from '../configure/variables';
import { pino } from 'pino';
import pretty from 'pino-pretty';

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

	const enablePretty = true; // TODO: use CLI FLAG

	let options: pino.LoggerOptions = {
		level: PinoLogLevel.Info,
	};

	if (enablePretty) {
		const stream = pretty({
			colorize: true,
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
