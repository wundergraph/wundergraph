import fs, { promises as fsp } from 'fs';
import { getRepository } from '../helpers/getRepository';

jest.setTimeout(20000);
test('The command should clone the repository using example name and github link and return "success"', async () => {
	const firstTestResponse = await getRepository({ exampleName: 'caching', projectName: 'tempRepository1' });
	expect(firstTestResponse).toEqual('success');
	try {
		const currentDirectory = process.cwd();
		await fsp.access(currentDirectory);
		fs.rmSync(currentDirectory, { recursive: true, force: true });
		process.chdir(currentDirectory.substring(0, currentDirectory.lastIndexOf('/')));
	} catch (e) {}

	const secondTestResponse = await getRepository({
		githubLink: 'https://github.com/wundergraph/wundergraph/tree/main/examples/caching',
		projectName: 'tempRepository2',
	});
	expect(secondTestResponse).toEqual('success');
	try {
		const currentDirectory = process.cwd();
		await fsp.access(currentDirectory);
		fs.rmSync(currentDirectory, { recursive: true, force: true });
		process.chdir(currentDirectory.substring(0, currentDirectory.lastIndexOf('/')));
	} catch (e) {}
});
