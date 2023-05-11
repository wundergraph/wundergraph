import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {},
		mutations: {},
		uploads: {
			minio1: {
				coverPicture: {
					preUpload: ({ user, file, meta }) => {
						console.log(`preUpload user: ${user}, file: ${file}, meta: ${meta}`);
						// Use this coupled with requireAuthentication: false in the profile
						// definition to conditionally allow uploads from anonoymous users
						// if (!user) {
						// 	return { error: 'authenticate' };
						// }

						// Optional: Indicate a key to store the file. Defaults to a hash of
						// the file contents.
						return { fileKey: `coverPicture/${file.name}` };
					},
					postUpload: async ({ user, file, meta, internalClient, error }) => {
						console.log(
							`postUpload user: ${user}, file: ${file}, meta: ${meta}, internalClient: ${internalClient}, error: ${error}`
						);
					},
				},
			},
		},
	},
}));
