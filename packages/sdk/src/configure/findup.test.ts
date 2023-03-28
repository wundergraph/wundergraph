import path from 'path';

import { findUp } from './findup';

describe('findUp', () => {
	const testdata = path.join(__dirname, 'testdata');
	it('should find the file', async () => {
		expect(await findUp('testfile', testdata)).toBe(path.join(testdata, 'testfile'));
	});

	it('should find nested file', async () => {
		const nested = path.join(testdata, 'testdir');
		expect(await findUp('testfile', nested)).toBe(path.join(nested, 'testfile'));
	});

	it('should return undefined when the file does not exist', async () => {
		expect(await findUp('does not exist', testdata)).toBeUndefined();
	});

	it('should skip directories', async () => {
		expect(await findUp('testdir', testdata)).toBeUndefined();
	});
});
