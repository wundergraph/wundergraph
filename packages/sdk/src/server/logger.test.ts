import { pino } from 'pino';
import { createLogger, RequestLogger, pinoOptions } from './logger';

class destinationStream {
	public messages: string[] = [];

	write(msg: string): void {
		this.messages.push(msg.trim());
	}
}

const expectLog = (fn: (logger: RequestLogger) => void) => {
	const destination = new destinationStream();
	const pinoLogger: pino.Logger = pino(
		{
			...pinoOptions(),
			level: 'trace',
			base: null,
			timestamp: false,
		},
		destination
	);
	const logger = createLogger(pinoLogger);
	fn(logger);
	return expect(destination.messages[destination.messages.length - 1]);
};

describe('Logger', () => {
	test('log string', async () => {
		expectLog((logger) => {
			logger.debug('a');
		}).toBe(`{"level":"debug","msg":"a"}`);
	});

	test('log string and object', async () => {
		expectLog((logger) => {
			logger.debug('a', { a: 1, b: 2 });
		}).toBe(`{"level":"debug","a":1,"b":2,"msg":"a"}`);
	});

	test('log string and error', async () => {
		// These should both expand the error properties
		expectLog((logger) => {
			logger.debug('bad', { error: new Error('terrible') });
		}).toMatch(/"stack"/);

		expectLog((logger) => {
			logger.debug('bad', new Error('terrible'));
		}).toMatch(/"stack"/);
	});

	test('log without using format specifiers', async () => {
		expectLog((logger) => {
			logger.debug('hello %s %s');
		}).toBe(`{"level":"debug","msg":"hello %s %s"}`);

		expectLog((logger) => {
			logger.debug('hello %s %s', { a: 1, b: 2 });
		}).toBe(`{"level":"debug","a":1,"b":2,"msg":"hello %s %s"}`);
	});

	test('logging levels', async () => {
		expectLog((logger) => {
			logger.trace('trace');
		}).toMatch(`{"level":"trace","msg":"trace"}`);
		expectLog((logger) => {
			logger.debug('debug');
		}).toMatch(`{"level":"debug","msg":"debug"}`);
		expectLog((logger) => {
			logger.info('info');
		}).toMatch(`{"level":"info","msg":"info"}`);
		expectLog((logger) => {
			logger.warn('warn');
		}).toMatch(`{"level":"warn","msg":"warn"}`);
		expectLog((logger) => {
			logger.error('error');
		}).toMatch(`{"level":"error","msg":"error"}`);
		expectLog((logger) => {
			logger.fatal('fatal');
		}).toMatch(`{"level":"fatal","msg":"fatal"}`);
	});
});
