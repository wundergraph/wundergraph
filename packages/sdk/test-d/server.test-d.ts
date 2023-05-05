import { expectType } from 'tsd';
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
	InternalClient,
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

export interface HookContext extends BaseRequestContext<User, InternalClient, OperationsClient> {}

export type HooksConfig = HooksConfiguration<
	QueryHooks,
	MutationHooks,
	SubscriptionHooks,
	UploadHooks,
	DataSources,
	HookContext
>;

export type QueryHooks = {
	Country?: QueryHook<{ id: number }, { data: { name: string } }, HookContext>;
	FakeWeather?: QueryHookWithoutInput<{ data: { temp: number } }, HookContext>;
};

export type MutationHooks = {
	SetName?: MutationHook<{ id: number }, { data: { name: string } }, HookContext>;
	Delete?: MutationHookWithoutInput<{}, HookContext>;
};

export type SubscriptionHooks = {
	Countdown?: SubscriptionHook<{ from: number }, { data: { countdown: number } }, HookContext>;
	Price?: SubscriptionHookWithoutInput<{ data: { price: number } }, HookContext>;
};

export type WebhooksConfig = {
	stripe?: WebhookConfiguration;
};

export interface UploadHooks {
	withProfiles?: {
		avatar?: {
			preUpload?: (hook: PreUploadHookRequest<User>) => PreUploadHookResponse;
			postUpload?: (hook: PostUploadHookRequest<User, InternalClient>) => PostUploadHookResponse;
		};
	};
	withoutProfiles?: {};
}

const configuration = configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
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
}));

expectType<WunderGraphHooksAndServerConfig<any, any>>(configuration);
