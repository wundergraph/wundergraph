#! /usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import logSymbols from 'log-symbols';
import { getRepository } from './helpers/getRepository';
import packageJson from '../package.json';

let projectName = '';

const program = new Command('create-wundergraph-app')
	.version(packageJson.version)
	.arguments('[project-name]')
	.usage(`${chalk.green('[project-name]')} [options]`)
	.option(
		'-E, --example [name]',
		`Initialize a Wundergraph app from the examples in the official Wundergraph repository`
	)
	.option('-L, --link [githubLink]', `Initialize a Wundergraph app from a GitHub URL`)
	.option('-I, --init', `Initialize Wundergraph into an already existing repository`)
	.action((name) => {
		if (name) projectName = name;
	});
program.parse(process.argv);

const options = program.opts();

getRepository({ exampleName: options?.example, githubLink: options?.link, projectName, isInit: options?.init })
	.then(() => {
		console.log(logSymbols.success + chalk.green(' Project created successfully'));
	})
	.catch((reason) => {
		console.error(logSymbols.error + chalk.red(` Project creation failed: ${reason}`));
		process.exit(1);
	});
