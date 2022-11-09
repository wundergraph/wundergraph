#! /usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import logSymbols from 'log-symbols';
import { getRepository } from './helpers/getRepository';

let projectName = '';

const program = new Command('create-wundergraph-app')
	.version('0.0.1')
	.arguments('<project-name>')
	.usage(`${chalk.green('<project-name>')} [options]`)
	.option(
		'-E, --example [name]',
		`Initialize a Wundergraph app from the examples in the official Wundergraph repository`
	)
	.option('-L, --link [githubLink]', `Initialize a Wundergraph app from a GitHub URL`)
	.action((name) => {
		projectName = name;
	});
program.parse(process.argv);

const options = program.opts();

getRepository({ exampleName: options?.example, githubLink: options?.link, projectName })
	.then(() => {
		console.log(logSymbols.success + chalk.green(' Project created successfully'));
	})
	.catch(() => {
		console.error(logSymbols.error + chalk.red(' Project creation failed'));
		process.exit(1);
	});
