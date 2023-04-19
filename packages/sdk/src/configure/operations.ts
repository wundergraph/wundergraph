export interface OperationsConfiguration {
	defaultConfig: BaseOperationConfiguration;
	queries: ConfigureQuery;
	mutations: ConfigureMutation;
	subscriptions: ConfigureSubscription;
	custom?: any;
}

export interface BaseOperationConfiguration {
	authentication: {
		required: boolean;
	};
}

export interface QueryConfiguration extends BaseOperationConfiguration {
	caching: {
		enable: boolean;
		public: boolean;
		maxAge: number;
		staleWhileRevalidate: number;
	};
	liveQuery: {
		enable: boolean;
		pollingIntervalSeconds: number;
	};
}

export interface MutationConfiguration extends BaseOperationConfiguration {}

export interface SubscriptionConfiguration extends BaseOperationConfiguration {}

type OperationConfiguration = QueryConfiguration | MutationConfiguration | SubscriptionConfiguration;

export interface MutationConfiguration extends BaseOperationConfiguration {}

export interface SubscriptionConfiguration extends BaseOperationConfiguration {}

export type ConfigureOperation = (config: OperationConfiguration) => OperationConfiguration;
export type ConfigureQuery = (config: BaseOperationConfiguration) => QueryConfiguration;
export type CustomizeQuery = (config: QueryConfiguration) => QueryConfiguration;
export type ConfigureMutation = (config: BaseOperationConfiguration) => MutationConfiguration;
export type CustomizeMutation = (config: MutationConfiguration) => MutationConfiguration;
export type ConfigureSubscription = (config: BaseOperationConfiguration) => SubscriptionConfiguration;
export type CustomizeSubscription = (config: SubscriptionConfiguration) => SubscriptionConfiguration;

export interface WunderGraphOperationsConfig<T extends OperationsConfiguration> {
	operations?: T;
}

export function configureWunderGraphOperations<GeneratedOperationConfiguration extends OperationsConfiguration>(
	config: WunderGraphOperationsConfig<GeneratedOperationConfiguration>
): WunderGraphOperationsConfig<GeneratedOperationConfiguration>['operations'];
export function configureWunderGraphOperations(config: any): WunderGraphOperationsConfig<any>['operations'] {
	return config.operations;
}

export const disableAuth = <Configs extends QueryConfiguration | MutationConfiguration | SubscriptionConfiguration>(
	config: Configs
): Configs => {
	return {
		...config,
		authentication: {
			required: false,
		},
	};
};

export const enableAuth = <Configs extends QueryConfiguration | MutationConfiguration | SubscriptionConfiguration>(
	config: Configs
): Configs => {
	return {
		...config,
		authentication: {
			required: true,
		},
	};
};

export const enableCaching = (config: QueryConfiguration): QueryConfiguration => ({
	...config,
	caching: { ...config.caching, enable: true },
});
