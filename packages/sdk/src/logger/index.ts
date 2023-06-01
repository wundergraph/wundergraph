import { format } from 'node:util';
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
		level: logLevel,
		formatters: {
			level(label, number) {
				return { level: label };
			},
		},
		hooks: {
			logMethod(inputArgs, method) {
				// unlike console.{log,debug,error}(), pino's formatter omits extra arguments
				// that are not used (e.g. log('foo:%s', 'bar', 'baz')) will print 'foo:bar'
				// but console.log will emit 'foo:bar baz'. To make the logger work like other
				// logging functions, format the string using util.format and pass only the final
				// string to pino.
				//
				// Since pino also supports structured logging, we need to look for the first string
				// in the inputArgs and apply for formatting from there.
				let logMethodArgs: any[];
				const firstStringIndex = inputArgs.findIndex((v) => typeof v === 'string');
				if (firstStringIndex >= 0) {
					const rawArgs = inputArgs.slice(0, firstStringIndex);
					const toFormat = inputArgs.slice(firstStringIndex);
					const formatted = format(...toFormat);
					logMethodArgs = [...rawArgs, formatted];
				} else {
					logMethodArgs = inputArgs;
				}
				return method.apply(this, logMethodArgs as [string, ...any[]]);
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
