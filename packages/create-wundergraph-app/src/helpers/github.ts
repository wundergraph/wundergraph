import dotenv from 'dotenv';

dotenv.config();

export const getGitHubRequestOptions = () => {
	if (process.env.GITHUB_TOKEN) {
		return { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } };
	}
	return undefined;
};
