import { AsyncApiIntrospector, CodeGen, WunderGraphConfigApplicationConfig } from '../configure';
import { OperationsConfiguration } from '../configure/operations';

export interface ConfigSetupOptions {
	addApi: (api: AsyncApiIntrospector<any>) => void;
	addAuthProvider: <Type extends AuthProviderTypes>(
		type: AuthProviderTypes,
		authProvider: AuthProviderConfig[Type]
	) => void;
	addCodeGeneration: (codeGen: CodeGen) => void;
}

export interface WunderGraphConfigWithAppConfig extends WunderGraphConfig {
	applicationConfig: WunderGraphConfigApplicationConfig<any, any>;
}

export interface WunderGraphAppConfig
	extends Omit<WunderGraphConfig, 'operations'>,
		WunderGraphConfigApplicationConfig<any, any> {}

export interface WunderGraphIntegration {
	name: string;
	hooks?: {
		'config:setup'?: (options: ConfigSetupOptions) => void;
		'config:generated'?: (config: WunderGraphConfig) => void;
		'hooks:queries:preResolve'?: (context: any) => void;
	};
}

export type AuthProviderTypes = 'tokenBased' | 'cookieBased';
export type AuthProviderConfig = {
	cookieBased: CookieAuthProvider;
	tokenBased: TokenAuthProvider;
};
export type CookieAuthProvider = any;
export type TokenAuthProvider = any;

export interface WunderGraphConfig {
	integrations: WunderGraphIntegration[];
	operations?: Partial<OperationsConfiguration>;
}
