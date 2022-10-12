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
	const stringLevel = resolveConfigurationVariable(level).toUpperCase();
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

const initLogger = (): pino.Logger => {
	const enablePretty = process.env.WG_CLI_LOG_PRETTY === 'true';

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
				time: (timestamp: any) => `${timestamp}`,
			},
			ignore: 'pid,hostname',
			messageFormat: 'SDK: {msg}',
		});

		return pino(options, stream);
	}

	return pino(options);
};

const logger = initLogger();

export const SdkLogger = logger.child({ component: 'sdk' });
export const ServerLogger = logger.child({ component: 'server' });

export const SetLogLevel = (level: PinoLogLevel) => {
	SdkLogger.level = level;
};
