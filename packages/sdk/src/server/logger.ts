import { FastifyBaseLogger } from 'fastify';
import { pino } from 'pino';

/**
 * LogObject specifies the interface that optional structured objects
 * passed to logging functions must conform to. Additionally, if LogObject
 * is an instance of Error, its field will be expanded into the log message.
 */
interface LogObject extends Object {
	/**
	 * Optional Error instance to unwrap when formatting the log message.
	 * See also LogObject for some particularities on how Error instances
	 * are handled.
	 */
	error?: Error;
}

/** LogFn represents the function type for logging messages. Each
 * call should contain a message and, optionally, an object representing
 * properties used for structured logging. If the object has an "error"
 * key, it's interpreted as an Error and its properties are expanded in the
 * log.
 */
interface LogFn {
	<T extends LogObject>(msg: string, obj?: T): void;
}

/**
 * RequestLogger is the interface for the logger
 */
export interface RequestLogger {
	/**
	 * trace logs a message at the trace level
	 */
	trace: LogFn;
	/**
	 * debug logs a message at the debug level
	 */
	debug: LogFn;
	/**
	 * info logs a message at the info level
	 */
	info: LogFn;
	/**
	 * warn logs a message at the warning level
	 */
	warn: LogFn;
	/**
	 * error logs a message at the error level
	 */
	error: LogFn;
	/**
	 * fatal logs a message at the fatal level
	 */
	fatal: LogFn;

	/**
	 * Returns a logger with the provided bindings attached to its log messages
	 * @param bindings Key-value pairs to attach to all messages
	 * @returns The new logger instance
	 */
	withFields: <T extends LogObject>(bindings: T) => RequestLogger;
}

type ParentLogger = pino.Logger | FastifyBaseLogger;

/** createLogger returns a logger used for hooks, functions and webhooks */
export const createLogger = (logger: ParentLogger): RequestLogger => new WunderGraphRequestLogger(logger);

class WunderGraphRequestLogger {
	constructor(private logger: ParentLogger) {}

	private log<T extends LogObject>(fn: pino.LogFn, msg: string, obj?: T): void {
		if (obj) {
			(fn as (obj: unknown, msg?: string, ...args: any[]) => void).call(this.logger, obj, msg);
		} else {
			fn.call(this.logger, msg);
		}
	}

	trace<T extends LogObject>(msg: string, obj?: T): void {
		this.log(this.logger.trace, msg, obj);
	}

	debug<T extends LogObject>(msg: string, obj?: T): void {
		this.log(this.logger.debug, msg, obj);
	}

	info<T extends LogObject>(msg: string, obj?: T): void {
		this.log(this.logger.info, msg, obj);
	}

	warn<T extends LogObject>(msg: string, obj?: T): void {
		this.log(this.logger.warn, msg, obj);
	}

	error<T extends LogObject>(msg: string, obj?: T): void {
		this.log(this.logger.error, msg, obj);
	}

	fatal<T extends LogObject>(msg: string, obj?: T): void {
		this.log(this.logger.fatal, msg, obj);
	}

	withFields<T extends LogObject>(bindings: T): RequestLogger {
		return new WunderGraphRequestLogger(this.logger.child(bindings));
	}
}

/**
 * Returns the configuration options used by the WunderGraph SDK to configure pino in several places.
 * This is only exposed for sharing code between modules and it might go away at any time.
 * */
export const pinoOptions = (): pino.LoggerOptions => {
	return {
		formatters: {
			level: (label) => {
				return { level: label };
			},
		},
		errorKey: 'error',
	};
};
