import fs, { promises as fsp } from 'fs';
import path from 'path';
import { getRepository } from '../helpers/getRepository';
import { tmpdir } from 'os';

jest.setTimeout(20000);
test('The command should clone the repository using example name and github link and return "success"', async () => {
	const tempDirectory = tmpdir();
	const firstRepoName = `tempRepository1-${Date.now()}`;
	const secondRepoName = `tempRepository2-${Date.now()}`;
	const firstTestResponse = await getRepository({
		exampleName: 'caching',
		projectName: firstRepoName,
		directoryPath: tempDirectory,
	});
	expect(firstTestResponse).toEqual('success');
	let firstFilePresent: boolean;
	try {
		await fsp.access(path.join(tempDirectory, firstRepoName, 'package.json'));
		firstFilePresent = true;
	} catch (e) {
		firstFilePresent = false;
	}
	expect(firstFilePresent).toEqual(true);
	// deleting the cloned repo
	try {
		await fsp.access(path.join(tempDirectory, firstRepoName));
		fs.rmSync(path.join(tempDirectory, firstRepoName), { recursive: true, force: true });
	} catch (e) {}

	const secondTestResponse = await getRepository({
		githubLink: 'https://github.com/wundergraph/wundergraph/tree/main/examples/caching',
		projectName: secondRepoName,
		directoryPath: tempDirectory,
	});
	expect(secondTestResponse).toEqual('success');
	let secondFilePresent: boolean;
	try {
		await fsp.access(path.join(tempDirectory, secondRepoName, 'package.json'));
		secondFilePresent = true;
	} catch (e) {
		secondFilePresent = false;
	}
	expect(secondFilePresent).toEqual(true);
	// deleting the cloned repo
	try {
		await fsp.access(path.join(tempDirectory, secondRepoName));
		fs.rmSync(path.join(tempDirectory, secondRepoName), { recursive: true, force: true });
	} catch (e) {}
});
