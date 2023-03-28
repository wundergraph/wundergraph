import path from 'path';

import { findUp } from './findup';

describe('findUp', () => {
	const testdata = path.join(__dirname, 'testdata');
	it.only('should find the file', async () => {
		expect(await findUp('testfile', testdata)).toBe(path.join(testdata, 'testfile'));
	});

	it.only('should find nested file', async () => {
		const nested = path.join(testdata, 'testdir');
		expect(await findUp('testfile', nested)).toBe(path.join(nested, 'testfile'));
	});

	it.only('should return undefined when the file does not exist', async () => {
		expect(await findUp('does not exist', testdata)).toBeUndefined();
	});
});
