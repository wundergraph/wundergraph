import retry from 'async-retry';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import { createDirectory } from './createDirectory';
import { downloadAndExtractRepo } from './download';
import { checkIfValidExample, getExamplesList } from './examples';
import { getRepoInfo } from './getRepoInfo';
import { getRepoTags } from './getRepoTags';
import { validateBranch } from './validateBranch';
import * as process from 'process';
import { execSync } from 'node:child_process';
import ora from 'ora';

const resolveLatestWundergraphRef = async () => {
	const tags = await getRepoTags('https://github.com/wundergraph/wundergraph', '@wundergraph/sdk');
	return tags[tags.length - 1];
};

const resolveRepository = async ({ exampleName, githubLink }: { exampleName?: string; githubLink?: string }) => {
	try {
		let ref = '';
		if (!exampleName && !githubLink) {
			ref = await resolveLatestWundergraphRef();
			const examples = await getExamplesList(ref);
			const selectedExampleName = await inquirer.prompt({
				name: 'selectExample',
				type: 'list',
				message: 'Which example would you like to start with?',
				choices: [...examples],
			});
			return {
				repoOwnerName: 'wundergraph',
				repoName: 'wundergraph',
				ref: ref,
				filePath: `examples/${selectedExampleName['selectExample']}`,
			};
		}
		if (exampleName) {
			if (!ref) {
				ref = await resolveLatestWundergraphRef();
			}
			const selectedExampleName = await checkIfValidExample(exampleName, ref);
			return {
				repoOwnerName: 'wundergraph',
				repoName: 'wundergraph',
				ref: ref,
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
				ref: selectedBranchName,
				filePath: filePath,
			};
		}
		return { repoOwnerName: '', repoName: '', ref: '', filePath: '' };
	} catch (e) {
		throw e;
	}
};

export const getRepository = async ({
	exampleName,
	githubLink,
	projectName,
	isInit,
	directoryPath,
}: {
	exampleName?: string;
	githubLink?: string;
	projectName: string;
	isInit?: boolean;
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
		let resolvedProjectPath: string;

		if (isInit) {
			resolvedProjectPath = process.cwd();
			// ask the user for the package manager being used in the repo
			const packageManagerPrompt = await inquirer.prompt({
				name: 'packageManager',
				type: 'list',
				message: 'Which package manager is used in the project?',
				choices: ['npm', 'yarn', 'pnpm'],
			});
			const spinner = ora('Installing wundergraph/sdk...').start();
			// Install the wundergraph sdk
			const pm = packageManagerPrompt['packageManager'];
			const command = pm === 'yarn' ? 'add' : 'install';
			execSync(`${pm} ${command} @wundergraph/sdk`, { cwd: resolvedProjectPath });
			spinner.succeed(chalk.green('Successfully installed wundergraph/sdk'));
			exampleName = 'simple';
		} else {
			if (projectName === '') {
				// prompt the user to give the project name
				const projectNamePrompt = await inquirer.prompt({
					name: 'projectName',
					type: 'input',
					message: 'What would you like to name your app?',
					default: 'my-app',
				});
				projectName = projectNamePrompt['projectName'];
			}
			resolvedProjectPath = await createDirectory(projectName, directoryPath);
		}

		const { repoOwnerName, repoName, ref, filePath } = await resolveRepository({ exampleName, githubLink });
		if (repoOwnerName === '' || repoName === '' || ref === '') {
			console.log(chalk.red('Could not resolve the repository details. Please try again.'));
			throw new Error('Could not resolve the repository details. Please try again.');
		}
		await retry(
			() =>
				downloadAndExtractRepo({
					root: resolvedProjectPath,
					repoOwnerName: repoOwnerName,
					repoName: repoName,
					ref: ref,
					filePath: filePath,
					isInit: isInit,
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
