import chalk from 'chalk';
import path from 'path';

export const getRepoInfo = async (githubLink: string) => {
	if (!githubLink.startsWith('https://github.com/')) {
		console.log(chalk.red('The given link is not a github url'));
		throw new Error('The given link is not a github url');
	}
	const repoInfo = githubLink.split('/').slice(3);
	const repoOwnerName = repoInfo[0];
	const repoName = repoInfo[1];
	let branch = '';
	let filePath = '';
	if (repoInfo.length > 2) {
		branch = repoInfo[3];
		filePath = path.join(...repoInfo.slice(4));
	}
	return {
		repoName,
		repoOwnerName,
		branch,
		filePath,
	};
};
