import { expectType } from 'tsd';
import {
	Client,
	ClientResponse,
	MutationRequestOptions,
	QueryRequestOptions,
	ResponseError,
	SubscriptionRequestOptions,
	UploadResponse,
	UploadValidationOptions,
	User,
} from '../src/client';
import { ExtractMeta, ExtractProfileName, UploadRequestOptions } from '../src/client';

const client = new Client({
	baseURL: 'https://api.com',
	applicationHash: '123',
	customFetch: fetch as any,
	sdkVersion: '1.0.0',
});

// Queries

expectType<Promise<ClientResponse<{ id: string }, ResponseError>>>(
	client.query<QueryRequestOptions<'Weather', { lat: number }>, { id: string }, ResponseError>({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

expectType<Promise<ClientResponse<any>>>(
	client.query({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

// Mutation

expectType<Promise<ClientResponse<{ id: string }, ResponseError>>>(
	client.mutate<MutationRequestOptions<'Weather', { lat: number }>, { id: string }, ResponseError>({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

expectType<Promise<ClientResponse<any>>>(
	client.mutate({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

// Subscription

expectType<Promise<void | ClientResponse<{ id: string }, ResponseError>>>(
	client.subscribe<SubscriptionRequestOptions<'Weather', { lat: number }>, { id: string }, ResponseError>(
		{
			operationName: 'Weather',
			input: { lat: 1 },
		},
		(resp) => {
			expectType<{ id: string } | undefined>(resp.data);
		}
	)
);

expectType<Promise<void | ClientResponse<unknown>>>(
	client.subscribe(
		{
			operationName: 'Weather',
			input: { lat: 1 },
		},
		(resp) => {
			expectType<unknown>(resp.data);
		}
	)
);

expectType<Promise<void | ClientResponse<unknown>>>(
	client.subscribe(
		{
			operationName: 'Weather',
			input: { lat: 1 },
			sse: false,
		},
		(resp) => {
			expectType<unknown>(resp.data);
		}
	)
);

// Get user

expectType<Promise<User>>(client.fetchUser());

expectType<Promise<User<string>>>(client.fetchUser<User<string>>());

expectType<Promise<User<string>>>(
	client.fetchUser<User<string>>({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

// Login

expectType<void>(client.login('providerId'));
expectType<void>(client.login('providerId', 'redirectUrl'));
expectType<Promise<boolean>>(
	client.logout({
		logoutOpenidConnectProvider: true,
	})
);

// Logout

expectType<Promise<boolean>>(client.logout());
expectType<Promise<boolean>>(
	client.logout({
		logoutOpenidConnectProvider: true,
	})
);

// Set extra headers

expectType<void>(client.setExtraHeaders({ 'x-foo': 'bar' }));

// Build cache key

expectType<string>(
	Client.buildCacheKey({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

// Uploads

expectType<Promise<UploadResponse>>(
	client.uploadFiles({
		provider: 'minio',
		files: new FileList(),
	})
);

expectType<Promise<UploadResponse>>(
	client.uploadFiles<UploadRequestOptions<'minio', 'avatar', object>>({
		provider: 'minio',
		profile: 'avatar',
		files: new FileList(),
	})
);

/**
 * These tests simulate how we make the upload handler type safe in the generated client and other clients.
 * @todo Test the complete generated client.
 */
type S3ProvidersWithLegacy = {
	minio: {
		hasProfiles: true;
		profiles: {
			avatar: object;
			coverPicture: {
				postId: string;
			};
		};
	};
	aws: {
		hasProfiles: false;
		profiles: {};
	};
};

const S3UploadProviderData: { [provider: string]: { [profile: string]: UploadValidationOptions } } = {
	minio: {
		avatar: {
			requireAuthentication: true,
			maxAllowedUploadSizeBytes: 10485760,
			maxAllowedFiles: 1,
			allowedMimeTypes: ['image/png', 'image/jpeg'],
			allowedFileExtensions: ['png', 'jpg'],
		},
		coverPicture: {
			requireAuthentication: true,
			maxAllowedUploadSizeBytes: 10485760,
			maxAllowedFiles: 1,
			allowedMimeTypes: ['image/*'],
			allowedFileExtensions: ['png', 'jpg'],
		},
	},
	aws: {},
};

const uploadFilesWithLegacy = <
	ProviderName extends Extract<keyof S3ProvidersWithLegacy, string>,
	ProfileName extends ExtractProfileName<S3ProvidersWithLegacy[ProviderName]['profiles']> = ExtractProfileName<
		S3ProvidersWithLegacy[ProviderName]['profiles']
	>,
	Meta extends ExtractMeta<S3ProvidersWithLegacy[ProviderName]['profiles'], ProfileName> = ExtractMeta<
		S3ProvidersWithLegacy[ProviderName]['profiles'],
		ProfileName
	>
>(
	config: UploadRequestOptions<ProviderName, ProfileName, Meta>
) => {
	const profile = config.profile ? S3UploadProviderData[config.provider][config.profile as string] : undefined;
	return client.uploadFiles(config, profile);
};

const files = new FileList();

expectType<Promise<UploadResponse>>(
	uploadFilesWithLegacy({
		provider: 'minio',
		profile: 'avatar',
		meta: {
			postId: '1',
		},
		files,
	})
);

expectType<Promise<UploadResponse>>(
	uploadFilesWithLegacy({
		provider: 'aws',
		files,
	})
);

type S3ProvidersWithProfiles = {
	minio: {
		hasProfiles: true;
		profiles: {
			avatar: object;
			coverPicture: {
				postId: string;
			};
		};
	};
	aws: {
		hasProfiles: true;
		profiles: {
			logo: {
				orgId: string;
			};
		};
	};
};

const S3UploadProviderDataWithProfiles: { [provider: string]: { [profile: string]: UploadValidationOptions } } = {
	minio: {
		avatar: {
			requireAuthentication: true,
			maxAllowedUploadSizeBytes: 10485760,
			maxAllowedFiles: 1,
			allowedMimeTypes: ['image/png', 'image/jpeg'],
			allowedFileExtensions: ['png', 'jpg'],
		},
		coverPicture: {
			requireAuthentication: true,
			maxAllowedUploadSizeBytes: 10485760,
			maxAllowedFiles: 1,
			allowedMimeTypes: ['image/*'],
			allowedFileExtensions: ['png', 'jpg'],
		},
	},
};

const uploadFilesWithProfiles = <
	ProviderName extends Extract<keyof S3ProvidersWithProfiles, string>,
	ProfileName extends ExtractProfileName<S3ProvidersWithProfiles[ProviderName]['profiles']> = ExtractProfileName<
		S3ProvidersWithLegacy[ProviderName]['profiles']
	>,
	Meta extends ExtractMeta<S3ProvidersWithProfiles[ProviderName]['profiles'], ProfileName> = ExtractMeta<
		S3ProvidersWithProfiles[ProviderName]['profiles'],
		ProfileName
	>
>(
	config: UploadRequestOptions<ProviderName, ProfileName, Meta>
) => {
	const profile = config.profile
		? S3UploadProviderDataWithProfiles[config.provider][config.profile as string]
		: undefined;
	return client.uploadFiles(config, profile);
};

expectType<Promise<UploadResponse>>(
	uploadFilesWithProfiles({
		provider: 'aws',
		profile: 'logo',
		meta: {
			orgId: '1',
		},
		files,
	})
);

type S3ProvidersNoProfiles = {
	minio: {
		hasProfiles: true;
		profiles: {};
	};
};
const S3UploadProviderDataNoProfiles: { [provider: string]: { [profile: string]: UploadValidationOptions } } = {
	minio: {},
};

const uploadFilesNoProfiles = <
	ProviderName extends Extract<keyof S3ProvidersNoProfiles, string>,
	ProfileName extends ExtractProfileName<S3ProvidersNoProfiles[ProviderName]['profiles']> = ExtractProfileName<
		S3ProvidersNoProfiles[ProviderName]['profiles']
	>,
	Meta extends ExtractMeta<S3ProvidersNoProfiles[ProviderName]['profiles'], ProfileName> = ExtractMeta<
		S3ProvidersWithProfiles[ProviderName]['profiles'],
		ProfileName
	>
>(
	config: UploadRequestOptions<ProviderName, ProfileName, Meta>
) => {
	const profile = config.profile
		? S3UploadProviderDataNoProfiles[config.provider][config.profile as string]
		: undefined;
	return client.uploadFiles(config, profile);
};

expectType<Promise<UploadResponse>>(
	uploadFilesNoProfiles({
		provider: 'minio',
		files,
	})
);
