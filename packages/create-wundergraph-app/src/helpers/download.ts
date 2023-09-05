import chalk from 'chalk';
import { createWriteStream, promises as fsp } from 'fs';
import got from 'got';
import ora from 'ora';
import { tmpdir } from 'os';
import { join } from 'path';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import { getGitHubRequestOptions } from './github';

const pipeline = promisify(Stream.pipeline);

export const downloadTar = async (url: string) => {
	try {
		const tempFile = join(tmpdir(), `wundergraph-example.temp-${Date.now()}`);
		const options = {
			...getGitHubRequestOptions(),
			followRedirect: true,
		};
		await pipeline(got.stream(url, options), createWriteStream(tempFile));
		return tempFile;
	} catch (e) {
		console.error('Error', e);
		return '';
	}
};

export const downloadAndExtractRepo = async ({
	root,
	repoName,
	ref,
	repoOwnerName,
	filePath,
	isInit,
}: {
	root: string;
	repoName: string;
	ref: string;
	repoOwnerName: string;
	filePath?: string;
	isInit?: boolean;
}) => {
	try {
		const spinner = ora('Loading..').start();
		const tempFile = await downloadTar(`https://github.com/${repoOwnerName}/${repoName}/archive/${ref}.tar.gz`);
		await tar.x({
			file: tempFile,
			cwd: root,
			strip: filePath ? filePath.split('/').length + 1 : 1,
			filter: (p) => {
				const rel = p.split('/').slice(1).join('/');
				if (isInit) {
					return rel.startsWith(`${filePath ? `${filePath}/.wundergraph` : ''}`);
				} else {
					return rel.startsWith(`${filePath ? `${filePath}/` : ''}`);
				}
			},
		});
		await fsp.unlink(tempFile);
		spinner.succeed(chalk.green('Successfully cloned the repository'));
	} catch (e) {
		console.error(chalk.red('Failed to clone the repository'));
		process.exit(1);
	}
};
