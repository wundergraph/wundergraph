import {
	Client,
	ClientConfig,
	User,
	UploadRequestOptions,
	OperationMetadata,
	OperationsDefinition,
	OperationRequestOptions,
	SubscriptionRequestOptions,
	SubscriptionEventHandler,
	FetchUserRequestOptions,
} from '@wundergraph/sdk/client';
import type {
	CountdownResponse,
	CountdownInput,
	CountdownResponseData,
	FakeWeatherResponse,
	FakeWeatherResponseData,
	HelloResponse,
	HelloInput,
	HelloResponseData,
	HelloUserResponse,
	HelloUserResponseData,
	PastLaunchesResponse,
	PastLaunchesResponseData,
	ProtectedWeatherResponse,
	ProtectedWeatherInput,
	ProtectedWeatherResponseData,
	SetNameResponse,
	SetNameInput,
	SetNameResponseData,
	TestResponse,
	TestInput,
	TestResponseData,
	WeatherResponse,
	WeatherInput,
	WeatherResponseData,
} from './models';

export type UserRole = 'admin' | 'user';

export const WUNDERGRAPH_S3_ENABLED = true;
export const WUNDERGRAPH_AUTH_ENABLED = true;

export interface UploadResponse {
	key: string;
}

export enum S3Provider {
	'minio' = 'minio',
}

export type UploadConfig = UploadRequestOptions<S3Provider>;

export enum AuthProviderId {
	'github' = 'github',
	'auth0' = 'auth0',
}

export interface AuthProvider {
	id: AuthProviderId;
	login: (redirectURI?: string) => void;
}

export const defaultClientConfig: ClientConfig = {
	applicationHash: 'f6933249',
	applicationPath: 'api/main',
	baseURL: 'http://localhost:9991',
	sdkVersion: '0.121.0',
};

export const operationMetadata: OperationMetadata = {
	Countdown: {
		requiresAuthentication: false,
	},
	FakeWeather: {
		requiresAuthentication: false,
	},
	Hello: {
		requiresAuthentication: false,
	},
	HelloUser: {
		requiresAuthentication: true,
	},
	PastLaunches: {
		requiresAuthentication: false,
	},
	ProtectedWeather: {
		requiresAuthentication: true,
	},
	SetName: {
		requiresAuthentication: false,
	},
	Test: {
		requiresAuthentication: false,
	},
	Weather: {
		requiresAuthentication: false,
	},
};

type PrivateConfigProperties = 'applicationHash' | 'applicationPath' | 'sdkVersion' | 'operationMetadata';

export class WunderGraphClient extends Client {
	query<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data']
	>(options: OperationName extends string ? OperationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.query<OperationRequestOptions, Data>(options);
	}
	mutate<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data']
	>(options: OperationName extends string ? OperationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.mutate<OperationRequestOptions, Data>(options);
	}
	subscribe<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: OperationName extends string
			? SubscriptionRequestOptions<OperationName, Input>
			: SubscriptionRequestOptions,
		cb: SubscriptionEventHandler<Data>
	) {
		return super.subscribe(options, cb);
	}
	public async uploadFiles(config: UploadConfig) {
		return super.uploadFiles(config);
	}
	public login(authProviderID: Operations['authProvider'], redirectURI?: string) {
		return super.login(authProviderID, redirectURI);
	}
	public async fetchUser<TUser extends User = User<UserRole>>(options: FetchUserRequestOptions) {
		return super.fetchUser<TUser>(options);
	}
}

export const createClient = (config?: Partial<Omit<ClientConfig, PrivateConfigProperties>>) => {
	return new WunderGraphClient({
		...defaultClientConfig,
		...config,
		operationMetadata,
	});
};

export type Queries = {
	FakeWeather: {
		input?: undefined;
		data: FakeWeatherResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	Hello: {
		input: HelloInput;
		data: HelloResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	HelloUser: {
		input?: undefined;
		data: HelloUserResponseData;
		requiresAuthentication: true;
		liveQuery: boolean;
	};
	PastLaunches: {
		input?: undefined;
		data: PastLaunchesResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	ProtectedWeather: {
		input: ProtectedWeatherInput;
		data: ProtectedWeatherResponseData;
		requiresAuthentication: true;
		liveQuery: boolean;
	};
	Test: {
		input: TestInput;
		data: TestResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	Weather: {
		input: WeatherInput;
		data: WeatherResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {
	SetName: {
		input: SetNameInput;
		data: SetNameResponseData;
		requiresAuthentication: false;
	};
};

export type Subscriptions = {
	Countdown: {
		input: CountdownInput;
		data: CountdownResponseData;
		requiresAuthentication: false;
	};
};

export type LiveQueries = {
	FakeWeather: {
		input?: undefined;
		data: FakeWeatherResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
	Hello: {
		input: HelloInput;
		data: HelloResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
	HelloUser: {
		input?: undefined;
		data: HelloUserResponseData;
		liveQuery: true;
		requiresAuthentication: true;
	};
	PastLaunches: {
		input?: undefined;
		data: PastLaunchesResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
	ProtectedWeather: {
		input: ProtectedWeatherInput;
		data: ProtectedWeatherResponseData;
		liveQuery: true;
		requiresAuthentication: true;
	};
	Test: {
		input: TestInput;
		data: TestResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
	Weather: {
		input: WeatherInput;
		data: WeatherResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
};

export interface Operations
	extends OperationsDefinition<
		Queries,
		Mutations,
		Subscriptions,
		UserRole,
		keyof typeof S3Provider,
		keyof typeof AuthProviderId
	> {}
