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

type FSFile = {
	contents: string;
};

type FSDir = {
	contents: null;
	children: FSEntry[];
};

type FSEntry = {
	name: string;
} & (FSFile | FSDir);

const downloadRepoDirectory = async (
	repoOwner: string,
	repoName: string,
	repoDirPath: string,
	ref: string
): Promise<FSEntry[]> => {
	const options = {
		...getGitHubRequestOptions(),
		followRedirect: true,
	};
	const resp = await got
		.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoDirPath}?ref=${ref}`, options)
		.catch((e: any) => {
			throw e;
		});
	const remoteEntries = JSON.parse(resp.body) as { name: string; type: string; download_url: string | null }[];
	const entries: FSEntry[] = [];
	const tasks: (() => Promise<void>)[] = [];
	for (const entry of remoteEntries) {
		switch (entry.type) {
			case 'dir':
				tasks.push(async () => {
					const name = entry.name;
					const sub = await downloadRepoDirectory(repoOwner, repoName, repoDirPath + '/' + name, ref);
					entries.push({
						name: name,
						contents: null,
						children: sub,
					});
				});
				break;
			case 'file':
				const name = entry.name;
				const download_url = entry.download_url!;
				tasks.push(async () => {
					const resp = await got.get(download_url, options).catch((e: any) => {
						throw new Error(`error downloading ${download_url}: ${e}`);
					});
					entries.push({
						name: name,
						contents: resp.body,
					});
				});
				break;
			default:
				throw new Error(`unknown entry type ${entry.type}`);
		}
	}
	await Promise.all(tasks.map((t) => t()));
	return entries;
};

const writeFiles = async (root: string, files: FSEntry[]) => {
	const tasks: (() => Promise<void>)[] = [];
	for (const file of files) {
		const name = join(root, file.name);
		if (typeof file.contents === 'string') {
			tasks.push(async () => {
				await fsp.writeFile(name, file.contents, { encoding: 'utf-8' });
				// XXX: GitHub API doesn't provide the file permissions, so we
				// have to make an educated guess
				if (name.endsWith('.sh')) {
					await fsp.chmod(name, 0o755);
				}
			});
		} else {
			tasks.push(async () => {
				await fsp.mkdir(name, { recursive: true });
				await writeFiles(name, file.children);
			});
		}
	}
	await Promise.all(tasks.map((t) => t()));
};

const downloadAndExtractRepoWithApi = async (
	root: string,
	repoOwnerName: string,
	repoName: string,
	filePath: string,
	ref: string
) => {
	const files = await downloadRepoDirectory(repoOwnerName, repoName, filePath ?? '', ref);
	await writeFiles(root, files);
};

export const downloadAndExtractRepoWithTarball = async (
	root: string,
	repoOwnerName: string,
	repoName: string,
	ref: string,
	filePath?: string,
	isInit?: boolean
) => {
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
	const spinner = ora('Loading..').start();
	try {
		try {
			await downloadAndExtractRepoWithApi(root, repoOwnerName, repoName, filePath ?? '', ref);
		} catch (e: any) {
			if (e.code !== 'ERR_NON_2XX_3XX_RESPONSE') {
				throw e;
			}
			await downloadAndExtractRepoWithTarball(root, repoOwnerName, repoName, ref, filePath, isInit);
		}
	} catch (e: any) {
		console.error(chalk.red(`Failed to clone the repository: ${e}`));
		process.exit(1);
	}
	spinner.succeed(chalk.green('Successfully cloned the repository'));
};
