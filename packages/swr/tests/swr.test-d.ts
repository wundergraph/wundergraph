import { Client, ClientResponseError, OperationsDefinition, UploadResponse, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { SWRResponse } from 'swr';
import { createHooks } from '../src';
import { SWRMutationResponse } from 'swr/mutation';

export type UserRole = 'admin' | 'user';

export enum AuthProviderId {
	'github' = 'github',
	'auth0' = 'auth0',
}

type Queries = {
	Weather: {
		input: {
			city: string;
		};
		data: any;
		requiresAuthentication: boolean;
	};
};

type Mutations = {
	CreateUser: {
		input: {
			name: string;
		};
		data: any;
		requiresAuthentication: boolean;
	};
};

type Subscriptions = {
	Weather: {
		input: {
			forCity: string;
		};
		data: any;
		requiresAuthentication: boolean;
	};
};

type S3Providers = {
	minio: {
		hasProfiles: true;
		profiles: {
			avatar: object;
			coverPicture: {
				postId: string;
			};
		};
	};
};

type Operations = OperationsDefinition<
	Queries,
	Mutations,
	Subscriptions,
	UserRole,
	S3Providers,
	keyof typeof AuthProviderId
>;

const { useSubscription, useQuery, useMutation, useUser, useFileUpload } = createHooks<Operations>(
	new Client({
		baseURL: 'http://localhost:8080',
		applicationHash: 'my-application-hash',
		sdkVersion: '0.0.0',
	})
);

const { data: queryData, error: queryError } = useQuery({
	enabled: true,
	operationName: 'Weather',
	input: {
		city: 'Berlin',
	},
});

expectType<Operations['queries']['Weather']['data']>(queryData);
expectType<ClientResponseError | undefined>(queryError);

const { data: subData, error: subError } = useSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

expectType<Operations['subscriptions']['Weather']['data']>(subData);
expectType<ClientResponseError | undefined>(subError);

const {
	data: mutData,
	error: mutError,
	trigger,
} = useMutation({
	operationName: 'CreateUser',
});

expectType<Operations['mutations']['CreateUser']['data']>(mutData);
expectType<ClientResponseError | undefined>(mutError);

expectType<Promise<any>>(
	trigger({
		name: 'John Doe',
	})
);

expectType<SWRResponse<User<UserRole>, ClientResponseError>>(useUser());
expectType<SWRResponse<User<UserRole>, ClientResponseError>>(
	useUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

const { upload } = useFileUpload();

expectType<Promise<string[]>>(
	upload({
		provider: 'minio',
		profile: 'coverPicture',
		meta: {
			postId: '1',
		},
		files: new FileList(),
	})
);
