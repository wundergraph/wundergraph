import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

export const getExamplesList = async (ref: string) => {
	const exampleDirectoriesResponse = await got
		.get(`https://api.github.com/repos/wundergraph/wundergraph/contents/examples?ref=${ref}`)
		.catch((e) => {
			throw e;
		});
	const exampleDirectories = JSON.parse(exampleDirectoriesResponse.body);
	const examples: string[] = [];
	exampleDirectories.forEach((element: { name: string; type: string }) => {
		if (element.type === 'dir') examples.push(element.name);
	});
	return examples;
};

export const checkIfValidExample = async (exampleName: string, ref: string) => {
	const examples = await getExamplesList(ref);

	if (!examples.includes(exampleName)) {
		console.error(chalk.red('The given example name doesnt exist in the Wundergraph repository'));
		const selectedExampleName = await inquirer.prompt({
			name: 'selectExample',
			type: 'list',
			message: 'Please select from the examples given below',
			choices: [...examples],
		});
		return selectedExampleName['selectExample'];
	}
	return exampleName;
};
