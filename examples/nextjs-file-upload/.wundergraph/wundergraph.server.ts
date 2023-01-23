import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {},
		mutations: {},
		uploads: {
			minio1: {
				coverPicture: {
					preUpload: ({ user, file, meta }) => {
						console.log(`preUpload user: ${user}, file: ${file}, meta: ${meta}`);
						if (!user) {
							return { error: 'authenticate' };
						}
						return { fileKey: 'myfile.png' };
						// return {fileKey: file.name}
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
