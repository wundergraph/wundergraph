#! /usr/bin/env node
import retry from 'async-retry';
import chalk from 'chalk';
import { Command } from 'commander';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import logSymbols from 'log-symbols';
import { createDirectory } from './helpers/createDirectory.js';
import { downloadAndExtractRepo } from './helpers/download.js';
import { checkIfValidExample, getExamplesList } from './helpers/examples.js';
import { getRepoInfo } from './helpers/getRepoInfo.js';
import { validateBranch } from './helpers/validateBranch.js';

let projectName = '';

const program = new Command('create-wundergraph-app')
	.version('0.0.1')
	.arguments('<project-name>')
	.usage(`${chalk.green('<project-name>')} [options]`)
	.option('-E, --example [name]', `Initialize a wundergraph app from the examples in wundergraph repository`)
	.option('-L, --link [githubLink]', `Initialize a wundergraph app from the templates on GitHub`)
	.action((name) => {
		projectName = name;
	});
program.parse(process.argv);

const getRepository = async ({ exampleName, githubLink }: { exampleName?: string; githubLink?: string }) => {
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

		if (!exampleName && !githubLink) {
			const resolvedProjectPath = await createDirectory(projectName);
			const examples = await getExamplesList();
			const selectedExampleName = await inquirer.prompt({
				name: 'selectExample',
				type: 'list',
				message: 'Which example would you like to start with?',
				choices: [...examples],
			});
			await retry(
				() =>
					downloadAndExtractRepo({
						root: resolvedProjectPath,
						repoOwnerName: 'wundergraph',
						repoName: 'wundergraph',
						branch: 'main',
						filePath: `examples/${selectedExampleName['selectExample']}`,
					}),
				{
					retries: 3,
				}
			);
		}
		if (exampleName) {
			const selectedExampleName = await checkIfValidExample(exampleName);
			const resolvedProjectPath = await createDirectory(projectName);
			await retry(
				() =>
					downloadAndExtractRepo({
						root: resolvedProjectPath,
						repoOwnerName: 'wundergraph',
						repoName: 'wundergraph',
						branch: 'main',
						filePath: `examples/${selectedExampleName}`,
					}),
				{
					retries: 3,
				}
			);
		} else if (githubLink) {
			const { repoName, repoOwnerName, branch, filePath } = await getRepoInfo(githubLink);
			const resolvedProjectPath = await createDirectory(projectName);
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
					process.exit(1);
				}
			}
			await retry(
				() =>
					downloadAndExtractRepo({
						root: resolvedProjectPath,
						repoOwnerName: repoOwnerName,
						repoName: repoName,
						branch: selectedBranchName,
						filePath: filePath,
					}),
				{
					retries: 3,
				}
			);
		}
	} catch (e) {
		console.error('Error', e);
		throw e;
	}
};

const options = program.opts();

getRepository({ exampleName: options?.example, githubLink: options?.link })
	.then(() => {
		console.log(logSymbols.success + chalk.green(' Project created successfully'));
	})
	.catch(() => {
		console.error(logSymbols.error + chalk.red(' Project creation failed'));
		process.exit(1);
	});
