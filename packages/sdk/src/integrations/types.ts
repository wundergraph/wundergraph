import {
	AsyncApiIntrospector,
	CodeGen,
	S3UploadConfiguration,
	WunderGraphConfigApplicationConfig,
	WunderGraphCorsConfiguration,
} from '../configure';
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
	applicationConfig: WunderGraphConfigApplicationConfig<any, any>;
}

export interface WunderGraphAppConfig
	extends Omit<WunderGraphConfig, 'operations' | 'options'>,
		WunderGraphConfigApplicationConfig<any, any> {}

export interface WunderGraphDatasource {
	name: string;
	hooks: WunderGraphIntegrationHooks;
}

export interface WunderGraphIntegrationHooks {
	'config:setup'?: (options: ConfigSetupOptions) => void;
	'config:generated'?: (config: WunderGraphConfig) => void;
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

export interface WunderGraphConfig
	extends Pick<WunderGraphConfigApplicationConfig<any, any>, 'cors' | 'experimental' | 'security' | 'authorization'> {
	datasources: WunderGraphDatasource[];
	integrations?: WunderGraphIntegration[];
	options?: WunderGraphNodeOptions;
}
