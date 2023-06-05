import { pino } from 'pino';

/**
 * LogObject specifies the interface that optional structured objects
 * passed to logging functions must conform to.
 */
interface LogObject extends Object {
	error?: Error;
	// XXX: This differs from the "err" default in pino and needs to be configured in sdk/src/logger/index.ts
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
	 * Returns a child logger with the provided bindings attached to its log messages
	 * @param bindings Key-value pairs to attach to all messages
	 * @returns The child logger
	 */
	child: <T extends LogObject>(bindings: T) => RequestLogger;
}

/** createLogger returns a logger used for hooks, functions and webhooks */
export const createLogger = (logger: pino.Logger): RequestLogger => new WunderGraphRequestLogger(logger);

class WunderGraphRequestLogger {
	constructor(private logger: pino.Logger) {}

	private log<T extends LogObject>(fn: pino.LogFn, msg: string, obj?: T): void {
		const pinoMsg = msg.replace('%', '%%');
		if (obj) {
			(fn as (obj: unknown, msg?: string, ...args: any[]) => void).call(this.logger, obj, pinoMsg);
		} else {
			fn.call(this.logger, pinoMsg);
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

	child<T extends LogObject>(bindings: T): RequestLogger {
		return new WunderGraphRequestLogger(this.logger.child(bindings));
	}
}
