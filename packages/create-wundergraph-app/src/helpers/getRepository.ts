import retry from 'async-retry';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import { createDirectory } from './createDirectory';
import { downloadAndExtractRepo } from './download';
import { checkIfValidExample, getExamplesList } from './examples';
import { getRepoInfo } from './getRepoInfo';
import { validateBranch } from './validateBranch';

const resolveRepository = async ({ exampleName, githubLink }: { exampleName?: string; githubLink?: string }) => {
	try {
		if (!exampleName && !githubLink) {
			const examples = await getExamplesList();
			const selectedExampleName = await inquirer.prompt({
				name: 'selectExample',
				type: 'list',
				message: 'Which example would you like to start with?',
				choices: [...examples],
			});
			return {
				repoOwnerName: 'wundergraph',
				repoName: 'wundergraph',
				branch: 'main',
				filePath: `examples/${selectedExampleName['selectExample']}`,
			};
		}
		if (exampleName) {
			const selectedExampleName = await checkIfValidExample(exampleName);
			return {
				repoOwnerName: 'wundergraph',
				repoName: 'wundergraph',
				branch: 'main',
				filePath: `examples/${selectedExampleName}`,
			};
		} else if (githubLink) {
			const { repoName, repoOwnerName, branch, filePath } = await getRepoInfo(githubLink);
			let selectedBranchName = branch;
			if (branch === '') {
				const branchPrompt = await inquirer.prompt({
					name: 'branch',
					type: 'input',
					message: 'Which branch of the repository would you like to use?',
					default: 'main',
				});
				selectedBranchName = branchPrompt['branch'];
				const isBranchValid = await validateBranch({
					repoName,
					repoOwnerName,
					branchName: selectedBranchName,
				});
				if (!isBranchValid) {
					console.log(chalk.red("The given branch name doesn't exist"));
					throw new Error("The given branch name doesn't exist");
				}
			}
			return {
				repoOwnerName: repoOwnerName,
				repoName: repoName,
				branch: selectedBranchName,
				filePath: filePath,
			};
		}
		return { repoOwnerName: '', repoName: '', branch: '', filePath: '' };
	} catch (e) {
		throw e;
	}
};

export const getRepository = async ({
	exampleName,
	githubLink,
	projectName,
	directoryPath,
}: {
	exampleName?: string;
	githubLink?: string;
	projectName: string;
	directoryPath?: string;
}) => {
	try {
		const wgGradient = gradient(['#a855f7', '#ec4899']);
		console.log(
			wgGradient(
				figlet.textSync('CREATE WG APP', {
					font: '3D-ASCII',
					whitespaceBreak: true,
				})
			)
		);
		const resolvedProjectPath = await createDirectory(projectName, directoryPath);
		const { repoOwnerName, repoName, branch, filePath } = await resolveRepository({ exampleName, githubLink });
		if (repoOwnerName === '' || repoName === '' || branch === '') {
			console.log(chalk.red('Could not resolve the repository details. Please try again.'));
			throw new Error('Could not resolve the repository details. Please try again.');
		}
		await retry(
			() =>
				downloadAndExtractRepo({
					root: resolvedProjectPath,
					repoOwnerName: repoOwnerName,
					repoName: repoName,
					branch: branch,
					filePath: filePath,
				}),
			{
				retries: 3,
			}
		);
		return 'success';
	} catch (e) {
		throw e;
	}
};
