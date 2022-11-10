import chalk from 'chalk';
import fs, { promises as fsp } from 'fs';
import inquirer from 'inquirer';
import logSymbols from 'log-symbols';
import path from 'path';

export const createDirectory = async (projectName: string, directoryPath?: string) => {
	let currentDirectory: string;
	if (!directoryPath) currentDirectory = process.cwd();
	else currentDirectory = directoryPath;
	const resolvedProjectPath = path.join(currentDirectory, projectName);
	try {
		await fsp.access(resolvedProjectPath);
		const selectedOverwriteOption = await inquirer.prompt({
			name: 'shouldOverwrite',
			type: 'list',
			message: 'The folder name already exists. Do you wish to overwrite the folder?',
			choices: ['Yes', 'No'],
		});
		if (selectedOverwriteOption['shouldOverwrite'] === 'Yes') {
			fs.rmSync(resolvedProjectPath, { recursive: true, force: true });
			await fsp.mkdir(resolvedProjectPath, { recursive: true });
		} else {
			console.log(chalk.red('Please retry the command with a different project name'));
			process.exit(1);
		}
	} catch (e) {
		// comes to the catch block when it cant find the directory
		await fsp.mkdir(resolvedProjectPath, { recursive: true });
	}
	process.chdir(resolvedProjectPath);
	console.log(chalk.green(logSymbols.success + ' Created the directory...', projectName));
	return resolvedProjectPath;
};
