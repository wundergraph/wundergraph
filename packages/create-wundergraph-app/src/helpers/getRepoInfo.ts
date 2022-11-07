import chalk from 'chalk';
import path from 'path';

export const getRepoInfo = async (githubLink: string) => {
	if (!githubLink.startsWith('https://github.com/')) {
		console.error(chalk.red('The given link is not a github url'));
		process.exit(1);
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
	// const repoContent = await got
	//   .get(
	//     `https://api.github.com/repos/${repoOwnerName}/${repoName}/contents/${filePath}`
	//   )
	//   .catch((e) => {
	//     console.log("Error", e);
	//     throw e;
	//   });
	return {
		repoName,
		repoOwnerName,
		branch,
		filePath,
		// repoContent: JSON.parse(repoContent.body),
	};
};
