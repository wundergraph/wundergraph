import { AsyncApiIntrospector, CodeGen, S3UploadConfiguration, WunderGraphConfigApplicationConfig } from '../configure';
import {
	BaseOperationConfiguration,
	MutationConfiguration,
	QueryConfiguration,
	SubscriptionConfiguration,
} from '../configure/operations';
import { NodeOptions } from '../configure/options';

export interface ConfigSetupOptions {
	addApi: (api: AsyncApiIntrospector<any>) => void;
	addAuthProvider: <Type extends AuthProviderTypes>(
		type: AuthProviderTypes,
		authProvider: AuthProviderConfig[Type]
	) => void;
	addS3Provider: (s3Provider: S3UploadConfiguration) => void;
	addCodeGeneration: (codeGen: CodeGen) => void;
}

export interface WunderGraphConfigWithAppConfig extends WunderGraphConfig {
	appConfig: WunderGraphConfigApplicationConfig<any, any>;
}

export interface WunderGraphAppConfig
	extends Omit<WunderGraphConfig, 'operations' | 'options'>,
		WunderGraphConfigApplicationConfig<any, any> {}

export interface WunderGraphDatasourceHooks {
	'config:setup'?: (options: Pick<ConfigSetupOptions, 'addApi'>) => void;
}

export interface WunderGraphDatasource {
	name: string;
	hooks: WunderGraphIntegrationHooks;
}

export interface WunderGraphIntegrationHooks {
	'config:setup'?: (options: ConfigSetupOptions) => void;
	'config:generated'?: (config: WunderGraphConfigWithAppConfig) => void;
}

export interface WunderGraphIntegration {
	name: string;
	hooks: WunderGraphIntegrationHooks;
}

export interface WunderGraphEnterpriseIntegrationHooks {
	'http:transport'?: <Context>(context: Context) => void;
}

export interface InternalIntergration {
	name: string;
	hooks: WunderGraphIntegrationHooks & WunderGraphEnterpriseIntegrationHooks;
}

export type AuthProviderTypes = 'tokenBased' | 'cookieBased';
export type AuthProviderConfig = {
	cookieBased: CookieAuthProvider;
	tokenBased: TokenAuthProvider;
};
export type CookieAuthProvider = any;
export type TokenAuthProvider = any;

export type WunderGraphNodeOptions = Pick<NodeOptions, 'defaultHttpProxyUrl' | 'defaultRequestTimeoutSeconds'>;

/**
 * Customize configuration for queries, mutations and subscriptions
 *
 * @see Docs https://docs.wundergraph.com/docs/wundergraph-operations-ts-reference/custom-operations-configuration
 */
export interface CustomOperationsConfiguration {}

/**
 * Configuration for queries, mutations and subscriptions
 *
 * @see Docs https://docs.wundergraph.com/docs/wundergraph-operations-ts-reference
 */
export interface WunderGraphConfigOperations {
	defaultConfig?: BaseOperationConfiguration;
	queries?: QueryConfiguration;
	mutations?: MutationConfiguration;
	subscriptions?: SubscriptionConfiguration;
	custom?: CustomOperationsConfiguration;
}

export interface WunderGraphConfig
	extends Pick<WunderGraphConfigApplicationConfig<any, any>, 'cors' | 'experimental' | 'security' | 'authorization'> {
	datasources: WunderGraphDatasource[];
	integrations?: WunderGraphIntegration[];
	options?: WunderGraphNodeOptions;
	operations?: WunderGraphConfigOperations;
}
