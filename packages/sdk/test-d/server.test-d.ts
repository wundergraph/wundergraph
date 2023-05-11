import { expectType } from 'tsd';
import {
	BaseRequestContext,
	HooksConfiguration,
	InternalContextFactoryContext,
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

export interface HookContext<TCustomContext>
	extends BaseRequestContext<User, InternalClient, OperationsClient, TCustomContext> {}

export interface ContextFactoryContext extends InternalContextFactoryContext<User, InternalClient, OperationsClient> {}

export type HooksConfig<TCustomContext> = HooksConfiguration<
	QueryHooks<TCustomContext>,
	MutationHooks<TCustomContext>,
	SubscriptionHooks<TCustomContext>,
	UploadHooks<TCustomContext>,
	DataSources,
	HookContext<TCustomContext>
>;

export type QueryHooks<TCustomContext> = {
	Country?: QueryHook<{ id: number }, { data: { name: string } }, HookContext<TCustomContext>>;
	FakeWeather?: QueryHookWithoutInput<{ data: { temp: number } }, HookContext<TCustomContext>>;
};

export type MutationHooks<TCustomContext> = {
	SetName?: MutationHook<{ id: number }, { data: { name: string } }, HookContext<TCustomContext>>;
	Delete?: MutationHookWithoutInput<{}, HookContext<TCustomContext>>;
};

export type SubscriptionHooks<TCustomContext> = {
	Countdown?: SubscriptionHook<{ from: number }, { data: { countdown: number } }, HookContext<TCustomContext>>;
	Price?: SubscriptionHookWithoutInput<{ data: { price: number } }, HookContext<TCustomContext>>;
};

export type WebhooksConfig = {
	stripe?: WebhookConfiguration;
};

export interface UploadHooks<TCustomContext> {
	withProfiles?: {
		avatar?: {
			preUpload?: (hook: PreUploadHookRequest<User, TCustomContext>) => PreUploadHookResponse;
			postUpload?: (hook: PostUploadHookRequest<User, InternalClient, TCustomContext>) => PostUploadHookResponse;
		};
	};
	withoutProfiles?: {};
}

class MyCustomContext {
	hello() {
		return 'world';
	}
}

type ContextFactory = (ctx: ContextFactoryContext) => Promise<MyCustomContext>;

const configuration = configureWunderGraphServer<
	HooksConfig<MyCustomContext>,
	InternalClient,
	WebhooksConfig,
	ContextFactory
>(() => ({
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
	createContext: async (_) => {
		return new MyCustomContext();
	},
}));

expectType<WunderGraphHooksAndServerConfig<any, any, ContextFactory>>(configuration);
expectType<(ctx: ContextFactoryContext) => Promise<MyCustomContext>>(configuration.createContext!);
