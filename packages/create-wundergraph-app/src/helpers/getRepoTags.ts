import got from 'got';

import { getRepoInfo } from './getRepoInfo';
import { getGitHubRequestOptions } from './github';

export const getRepoTags = async (githubLink: string, prefix?: string) => {
	const { repoName, repoOwnerName } = await getRepoInfo(githubLink);
	const response = await got
		.get(`https://api.github.com/repos/${repoOwnerName}/${repoName}/git/refs/tags`, getGitHubRequestOptions())
		.catch((e: any) => {
			throw e;
		});
	const data = JSON.parse(response.body);
	const prefixLength = 'refs/tags/'.length;
	let tags: string[] = data.map((item: { ref: string }) => {
		return item.ref.substring(prefixLength);
	});
	if (prefix) {
		tags = tags.filter((item) => item.startsWith(prefix));
	}
	return tags;
};
