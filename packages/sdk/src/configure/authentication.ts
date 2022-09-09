import { AuthProvider, AuthProviderKind, OpenIDConnectQueryParam } from '@wundergraph/protobuf';
import { mapInputVariable, InputVariable } from './index';

export interface AuthenticationProvider {
	resolve: () => AuthProvider;
}

export interface GithubAuthProviderConfig {
	id: string;
	clientId: InputVariable;
	clientSecret: InputVariable;
}

export class GithubAuthProvider implements AuthenticationProvider {
	private readonly config: GithubAuthProviderConfig;

	constructor(config: GithubAuthProviderConfig) {
		this.config = config;
	}

	resolve(): AuthProvider {
		return {
			kind: AuthProviderKind.AuthProviderGithub,
			githubConfig: {
				clientId: mapInputVariable(this.config.clientId),
				clientSecret: mapInputVariable(this.config.clientSecret),
			},
			oidcConfig: undefined,
			id: this.config.id,
		};
	}
}

export interface OpenIDConnectQueryParamConfig {
	name: string;
	value: InputVariable;
}

export interface OpenIDConnectAuthProviderConfig {
	id: string;
	issuer: InputVariable;
	clientId: InputVariable;
	clientSecret: InputVariable;
	queryParams?: OpenIDConnectQueryParamConfig[];
}

export class OpenIDConnectAuthProvider implements AuthenticationProvider {
	private readonly config: OpenIDConnectAuthProviderConfig;

	constructor(config: OpenIDConnectAuthProviderConfig) {
		this.config = config;
	}

	resolve(): AuthProvider {
		const queryParams = this.config.queryParams?.map(
			(param): OpenIDConnectQueryParam => ({
				name: param.name,
				value: mapInputVariable(param.value),
			})
		);

		return {
			kind: AuthProviderKind.AuthProviderOIDC,
			githubConfig: undefined,
			oidcConfig: {
				clientId: mapInputVariable(this.config.clientId),
				clientSecret: mapInputVariable(this.config.clientSecret),
				issuer: mapInputVariable(this.config.issuer),
				queryParams: queryParams || [],
			},
			id: this.config.id,
		};
	}
}

export interface GoogleAuthProviderConfig {
	id: string;
	clientId: InputVariable;
	clientSecret: InputVariable;
}

export const authProviders = {
	github: (config: GithubAuthProviderConfig) => new GithubAuthProvider(config),
	demo: () => new GithubAuthProvider({ id: 'github', clientId: 'demo', clientSecret: 'demo' }),
	openIdConnect: (config: OpenIDConnectAuthProviderConfig) => new OpenIDConnectAuthProvider(config),
	google: (config: GoogleAuthProviderConfig) =>
		new OpenIDConnectAuthProvider({
			...config,
			issuer: 'https://accounts.google.com',
		}),
};
