import got from 'got';

import { getGitHubRequestOptions } from './github';

export const validateBranch = async ({
	repoOwnerName,
	repoName,
	branchName,
}: {
	repoOwnerName: string;
	repoName: string;
	branchName: string;
}) => {
	try {
		const getBranchResponse = await got.get(
			`https://api.github.com/repos/${repoOwnerName}/${repoName}/branches/${branchName}`,
			getGitHubRequestOptions()
		);
		if (getBranchResponse.statusCode === 200) return true;
		else return false;
	} catch (e) {
		return false;
	}
};
