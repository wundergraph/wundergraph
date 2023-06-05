import { pino } from 'pino';
import { createLogger, RequestLogger } from './logger';

class destinationStream {
	public messages: string[] = [];

	write(msg: string): void {
		this.messages.push(msg.trim());
	}
}

const expectLog = (fn: (logger: RequestLogger) => void) => {
	const destination = new destinationStream();
	const pinoLogger = pino(
		{
			errorKey: 'error',
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

describe.only('Logger', () => {
	test('log string', async () => {
		expectLog((logger) => {
			logger.debug('a');
		}).toBe(`{"level":20,"msg":"a"}`);
	});

	test('log string and object', async () => {
		expectLog((logger) => {
			logger.debug('a', { a: 1, b: 2 });
		}).toBe(`{"level":20,"a":1,"b":2,"msg":"a"}`);
	});

	test('log string and error', async () => {
		// This should expand the error properties
		expectLog((logger) => {
			logger.debug('bad', { error: new Error('terrible') });
		}).toMatch(/"stack"/);
	});

	test('logging levels', async () => {
		expectLog((logger) => {
			logger.trace('trace');
		}).toMatch(`{"level":10,"msg":"trace"}`);
		expectLog((logger) => {
			logger.debug('debug');
		}).toMatch(`{"level":20,"msg":"debug"}`);
		expectLog((logger) => {
			logger.info('info');
		}).toMatch(`{"level":30,"msg":"info"}`);
		expectLog((logger) => {
			logger.warn('warn');
		}).toMatch(`{"level":40,"msg":"warn"}`);
		expectLog((logger) => {
			logger.error('error');
		}).toMatch(`{"level":50,"msg":"error"}`);
		expectLog((logger) => {
			logger.fatal('fatal');
		}).toMatch(`{"level":60,"msg":"fatal"}`);
	});
});
