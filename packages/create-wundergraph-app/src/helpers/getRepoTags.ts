//import got from 'got';

//import { getRepoInfo } from './getRepoInfo';
import dotenv from 'dotenv';

dotenv.config();

export const getRepoTags = async (githubLink: string, prefix?: string): Promise<Array<string>> => {
	//const { repoName, repoOwnerName } = await getRepoInfo(githubLink);
	let options;
	if (githubLink) {
	}
	if (prefix) {
	}
	if (process.env.GITHUB_TOKEN) {
		throw new Error("you've got a token");
		options = { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } };
	} else {
		throw new Error('not token for you');
	}
	if (options) {
	}
	return new Array();

	// const response = await got
	// 	.get(`https://api.github.com/repos/${repoOwnerName}/${repoName}/git/refs/tags`, options)
	// 	.catch((e: any) => {
	// 		throw e;
	// 	});
	// const data = JSON.parse(response.body);
	// const prefixLength = 'refs/tags/'.length;
	// let tags: string[] = data.map((item: { ref: string }) => {
	// 	return item.ref.substring(prefixLength);
	// });
	// if (prefix) {
	// 	tags = tags.filter((item) => item.startsWith(prefix));
	// }
	// return tags;
};
