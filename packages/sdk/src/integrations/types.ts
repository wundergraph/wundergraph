import { AsyncApiIntrospector, CodeGen, S3UploadConfiguration, WunderGraphConfigApplicationConfig } from '../configure';

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
	extends Omit<WunderGraphConfig, 'operations'>,
		WunderGraphConfigApplicationConfig<any, any> {}

export interface WunderGraphIntegration {
	name: string;
	hooks: {
		'config:setup'?: (options: ConfigSetupOptions) => void;
		'config:generated'?: (config: WunderGraphConfig) => void;
	};
}

export interface WunderGraphEnterpriseIntegration {
	name: string;
	hooks: WunderGraphIntegration['hooks'] & {
		'hooks:http:originTransport'?: <Context>(context: Context) => void;
	};
}

export type AuthProviderTypes = 'tokenBased' | 'cookieBased';
export type AuthProviderConfig = {
	cookieBased: CookieAuthProvider;
	tokenBased: TokenAuthProvider;
};
export type CookieAuthProvider = any;
export type TokenAuthProvider = any;

export interface WunderGraphConfig
	extends Pick<WunderGraphConfigApplicationConfig<any, any>, 'cors' | 'experimental' | 'options' | 'security'> {
	integrations: WunderGraphIntegration[];
}
