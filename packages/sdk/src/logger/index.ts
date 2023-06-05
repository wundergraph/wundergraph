import { ConfigurationVariable, LogLevel, logLevelFromJSON } from '@wundergraph/protobuf';
import { resolveConfigurationVariable } from '../configure/variables';
import { DestinationStream, pino } from 'pino';
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

	return resolvePinoLogLevel(stringLevel);
};

const resolvePinoLogLevel = (level: string): PinoLogLevel => {
	const stringLevel = level.toUpperCase();
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

const initLogger = (destination: DestinationStream): pino.Logger => {
	const enablePretty = process.env.WG_CLI_LOG_PRETTY === 'true';
	const logLevel =
		process.env.WG_DEBUG_MODE === 'true'
			? PinoLogLevel.Debug
			: process.env.WG_CLI_LOG_LEVEL
			? resolvePinoLogLevel(process.env.WG_CLI_LOG_LEVEL)
			: PinoLogLevel.Info;

	let options: pino.LoggerOptions = {
		// XXX: This key must match the one defined at LogObject in server/logger.ts
		errorKey: 'error',
		level: logLevel,
		formatters: {
			level(label, number) {
				return { level: label };
			},
		},
	};

	if (enablePretty) {
		const stream = pretty({
			colorize: true,
			colorizeObjects: false,
			translateTime: 'HH:MM:ss TT', // https://www.npmjs.com/package/dateformat
			customPrettifiers: {
				time: (timestamp: any) => `${timestamp}`,
			},
			ignore: 'pid,hostname',
			destination: destination,
			messageFormat: '{msg}',
			singleLine: true,
		});

		return pino(options, stream);
	}

	return pino(options);
};

const logger = initLogger(process.stdout);

export const Logger = logger.child({ component: '@wundergraph/sdk' });
export const ServerLogger = logger.child(
	{ component: '@wundergraph/server' },
	{ level: process.env.WG_DEBUG_MODE === 'true' ? PinoLogLevel.Debug : PinoLogLevel.Info }
);

export default Logger;

// This logger is used to log fatal errors to stderr
// which is used by wunderctl to read errors in TUI mode.
export const FatalLogger = initLogger(process.stderr).child({ component: '@wundergraph/sdk' });
