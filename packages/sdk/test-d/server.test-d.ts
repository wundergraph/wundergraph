import { expectAssignable, expectType } from 'tsd';
import {
	BaseRequestContext,
	HooksConfiguration,
	PreUploadHookRequest,
	PreUploadHookResponse,
	PostUploadHookRequest,
	PostUploadHookResponse,
	QueryHook,
	QueryHookWithoutInput,
	MutationHook,
	MutationHookWithoutInput,
	SubscriptionHook,
	SubscriptionHookWithoutInput,
	WunderGraphUser,
	OperationsClient,
	configureWunderGraphServer,
	WunderGraphHooksAndServerConfig,
	WebhookConfiguration,
} from '../src/server';

export type Role = 'admin' | 'user';

export type CustomClaims = {
	admin?: boolean;
};

export interface User extends WunderGraphUser<Role, CustomClaims> {}

export type DataSources = 'counter';

declare module '../src/server' {
	export interface HooksMeta {
		dataSources: DataSources;
		operationNames: 'Country' | 'FakeWeather' | 'SetName' | 'Delete' | 'Countdown' | 'Price';
		operations: OperationsClient;
		user: User;
	}
}

export type QueryHooks = {
	Country?: QueryHook<{ id: number }, { data: { name: string } }>;
	FakeWeather?: QueryHookWithoutInput<{ data: { temp: number } }>;
};

export type MutationHooks = {
	SetName?: MutationHook<{ id: number }, { data: { name: string } }>;
	Delete?: MutationHookWithoutInput<{}>;
};

export type SubscriptionHooks = {
	Countdown?: SubscriptionHook<{ from: number }, { data: { countdown: number } }>;
	Price?: SubscriptionHookWithoutInput<{ data: { price: number } }>;
};

export type WebhooksConfig = {
	stripe?: WebhookConfiguration;
};

export interface UploadHooks {
	withProfiles?: {
		avatar?: {
			preUpload?: (hook: PreUploadHookRequest<User>) => PreUploadHookResponse;
			postUpload?: (hook: PostUploadHookRequest<User>) => PostUploadHookResponse;
		};
	};
	withoutProfiles?: {};
}

class MyGlobalContext {
	whoami() {
		return 'global';
	}
}

class MyRequestContext {
	whoami() {
		return 'request';
	}
}

declare module '../src/server' {
	export interface CustomContext {
		global: MyGlobalContext;
		request: MyRequestContext;
	}
}

const configuration = configureWunderGraphServer(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginRequest: {
					hook: async ({ request }) => {
						console.log('onOriginRequest', request);
						return request;
					},
					enableForOperations: ['Country'],
				},
			},
			wsTransport: {
				onConnectionInit: {
					enableForDataSources: ['counter'],
					hook: async (hook) => {
						return {
							payload: {
								'x-header': 'string',
							},
						};
					},
				},
			},
		},
		authentication: {
			mutatingPostAuthentication: async (hook) => {
				console.log('mutatingPostAuthentication', JSON.stringify(hook.user));
				return {
					status: 'ok',
					user: {
						...hook.user,
						roles: ['user', 'admin'],
					},
				};
			},
			postLogout: async (hook) => {
				console.log('postLogout', JSON.stringify(hook.user));
			},
		},
		queries: {
			Country: {
				preResolve: async (hook) => {
					console.log('###preResolve', hook);
				},
				mutatingPreResolve: async (hook) => {
					console.log('###mutatingPreResolve', hook);
					return hook.input;
				},
				postResolve: async (hook) => {
					console.log('###postResolve', hook);
				},
				mutatingPostResolve: async (hook) => {
					console.log('###mutatingPostResolve', hook);

					return {
						data: {
							name: 'Berlin',
						},
					};
				},
			},
			FakeWeather: {
				mockResolve: async (hook) => {
					return {
						data: {
							temp: 10,
						},
					};
				},
			},
		},
		mutations: {
			SetName: {
				preResolve: async (hook) => {
					console.log('###preResolve', hook);
				},
				mutatingPreResolve: async (hook) => {
					console.log('###mutatingPreResolve', hook);
					return hook.input;
				},
				postResolve: async (hook) => {
					console.log('###postResolve', hook);
				},
				mutatingPostResolve: async (hook) => {
					console.log('###mutatingPostResolve', hook);
					return hook.response;
				},
			},
		},
	},
	context: {
		global: {
			create: async () => {
				return new MyGlobalContext();
			},
			release: async (ctx) => {
				expectType<MyGlobalContext>(ctx);
			},
		},
		request: {
			create: async (ctx) => {
				expectType<MyGlobalContext>(ctx);
				return new MyRequestContext();
			},
			release: async (ctx) => {
				expectType<MyRequestContext>(ctx);
			},
		},
	},
}));

expectType<WunderGraphHooksAndServerConfig>(configuration);

expectAssignable<(ctx: MyGlobalContext) => void>(configuration.context?.global?.release!);
expectAssignable<(ctx: MyRequestContext) => void>(configuration.context?.request?.release!);
