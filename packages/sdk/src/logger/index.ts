import { ConfigurationVariable, LogLevel, logLevelFromJSON } from '@wundergraph/protobuf';
import { resolveConfigurationVariable } from '../configure/variables';
import { DestinationStream, pino } from 'pino';
import { pinoOptions } from '../server/logger';

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
	const logLevel =
		process.env.WG_DEBUG_MODE === 'true'
			? PinoLogLevel.Debug
			: process.env.WG_CLI_LOG_LEVEL
			? resolvePinoLogLevel(process.env.WG_CLI_LOG_LEVEL)
			: PinoLogLevel.Info;

	let options: pino.LoggerOptions = {
		...pinoOptions(),
		level: logLevel,
	};

	return pino(options);
};

const logger = initLogger(process.stdout);

let cloudBindings: Record<string, any> = {};
if (process.env.WG_CLOUD_ENVIRONMENT_ID) {
	cloudBindings.environmentID = process.env.WG_CLOUD_ENVIRONMENT_ID;
}
if (process.env.WG_CLOUD_PROJECT_ID) {
	cloudBindings.projectID = process.env.WG_CLOUD_PROJECT_ID;
}
if (process.env.WG_CLOUD_DEPLOYMENT_ID) {
	cloudBindings.deploymentID = process.env.WG_CLOUD_DEPLOYMENT_ID;
}

export const Logger = logger.child({ component: '@wundergraph/sdk' });
export const ServerLogger = logger.child(
	{ component: '@wundergraph/server', ...cloudBindings },
	{ level: process.env.WG_DEBUG_MODE === 'true' ? PinoLogLevel.Debug : PinoLogLevel.Info }
);

export default Logger;

// This logger is used to log fatal errors to stderr
// which is used by wunderctl to read errors in TUI mode.
export const FatalLogger = initLogger(process.stderr).child({ component: '@wundergraph/sdk' });
