import got from 'got';

import { getRepoInfo } from './getRepoInfo';
import dotenv from 'dotenv';

dotenv.config();

export const getRepoTags = async (githubLink: string, prefix?: string) => {
	const { repoName, repoOwnerName } = await getRepoInfo(githubLink);
	let options;
	if (process.env.CI as unknown as boolean) {
		options = { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } };
	}

	const response = await got
		.get(`https://api.github.com/repos/${repoOwnerName}/${repoName}/git/refs/tags`, options)
		.catch((e) => {
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
