import { pino } from 'pino';
import pretty from 'pino-pretty';

enum PinoLogLevel {
	Fatal = 'fatal',
	Error = 'error',
	Warn = 'warn',
	Info = 'info',
	Debug = 'debug',
	Trace = 'trace',
	Silent = 'silent',
}

export const resolvePinoLogLevel = (): PinoLogLevel => {
	if (process.env.WG_DEBUG_MODE === 'true') {
		return PinoLogLevel.Debug;
	}
	if (!process.env.WG_CLI_LOG_LEVEL) {
		return PinoLogLevel.Info;
	}

	const level = process.env.WG_CLI_LOG_LEVEL.toUpperCase();
	switch (level) {
		case 'FATAL':
			return PinoLogLevel.Fatal;
		case 'PANIC':
			return PinoLogLevel.Fatal;
		case 'WARNING':
			return PinoLogLevel.Warn;
		case 'ERROR':
			return PinoLogLevel.Error;
		case 'INFO':
			return PinoLogLevel.Info;
		case 'DEBUG':
			return PinoLogLevel.Debug;
		default:
			throw new Error(`Unknown log level: ${level}`);
	}
};

const initLogger = (): pino.Logger => {
	const enablePretty = process.env.WG_CLI_LOG_PRETTY === 'true';

	let options: pino.LoggerOptions = {
		level: resolvePinoLogLevel(),
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
			messageFormat: '{msg}',
			singleLine: true,
		});

		return pino(options, stream);
	}

	return pino(options);
};

const logger = initLogger();

export const Logger = logger.child({ component: '@wundergraph/sdk' });
export const ServerLogger = logger.child(
	{ component: '@wundergraph/server' },
	{ level: process.env.WG_DEBUG_MODE === 'true' ? PinoLogLevel.Debug : PinoLogLevel.Info }
);

export default Logger;
