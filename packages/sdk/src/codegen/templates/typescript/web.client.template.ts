//language=handlebars
export const template = `
import type { {{ modelImports }} } from "./models";
import type { RequestOptions, UserListener, Response } from "@wundergraph/sdk";
import type { User, Role } from "./wundergraph.server";

import { WunderGraphClient, ClientConfig, UploadConfig as BaseUploadConfig, QueryResult, MutationResult, SubscriptionResult } from "@wundergraph/sdk/client";

export const WUNDERGRAPH_S3_ENABLED = {{hasS3Provider}};
export const WUNDERGRAPH_AUTH_ENABLED = {{hasAuthProviders}};

{{#if hasS3Provider}}
export interface UploadResponse { key: string }

export enum S3Provider {
    {{#each s3Provider }}
    "{{name}}" = "{{name}}",
    {{/each}}
}

export type UploadConfig = BaseUploadConfig<S3Provider>
{{/if}}

{{#if hasAuthProviders}}
export enum AuthProviderId {
    {{#each authProviders}}
    "{{.}}" = "{{.}}",
    {{/each}}
}

export interface AuthProvider {
    id: AuthProviderId;
    login: (redirectURI?: string) => void;
}
{{/if}}

export interface LogoutOptions {
    logout_openid_connect_provider?: boolean;
}

type Result<Data> = QueryResult<Data> | MutationResult<Data> | SubscriptionResult<Data>;

export class Client {
    constructor(config: Partial<ClientConfig> = {}) {
        const {
            baseURL = "{{ baseURL }}",
            ...rest
        } = config
        
        this._client = new WunderGraphClient<Role>({
            baseURL,
            applicationHash: "{{ applicationHash }}",
            applicationPath: "{{ applicationPath }}",
            sdkVersion: "{{ sdkVersion }}",
            ...rest
        });

        this.user = null;
    }
    private _client: WunderGraphClient<Role>;
    private logoutCallback: undefined | (() => void);
    public setLogoutCallback(cb: ()=>void){
        this.logoutCallback = cb;
    }

    private user: User | null;
    private userListener: UserListener<User> | undefined;
    public setUserListener = (listener: UserListener<User>) => {
        this.userListener = listener;
    }
    private setUser = (user: User | null) => {
        if (
            (user === null && this.user !== null) ||
            (user !== null && this.user === null) ||
            JSON.stringify(user) !== JSON.stringify(this.user)
        ) {
            this.user = user;
            if (this.userListener !== undefined) {
                this.userListener(this.user);
            }
        }
    };
	private resultToResponse = <TResponse>(result: Result<any>): Response<TResponse> => {
		switch (result.status) {
			case 'ok':
				return {
					status: 'ok',
					body: { data: result.data }
				} as Response<any>
			case 'error':
				return {
					status: 'error',
					message: result.errors[0].message,
				}
			case 'requires_authentication':
				return {
					status: 'requiresAuthentication'
				}
			case 'cancelled':
				return {
					status: 'aborted'
				}
			case 'partial': {
				return {
					status: 'error',
					message: result.errors[0].message,
				};
			}
			default:
				return {
					status: result.status
				}
		}
	};
    {{#if hasQueries}}
    public query = {
        {{#each queries}}
        {{operationName}}: async (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>) => {
            const result = await this._client.query({
                operationName: "{{operationName}}",
                {{#if hasInput}}input: options.input,{{/if}}
                abortSignal: options.abortSignal,
            })
            return this.resultToResponse<{{operationName}}Response>(result)
        },
        {{/each}}
    }
    {{/if}}
    {{#if hasMutations}}
    public mutation = {
    {{#each mutations}}
        {{operationName}}: async (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>) => {
            const result =  await this._client.mutate({
                operationName: "{{operationName}}",
                {{#if hasInput}}input: options.input,{{/if}}
                abortSignal: options.abortSignal,
            })
            return this.resultToResponse<{{operationName}}Response>(result)
        },
    {{/each}}
    }
    {{/if}}
    {{#if hasSubscriptions}}{{#unless reactNative}}
    public subscription = {
    {{#each subscriptions}}
        {{operationName}}: (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>, cb: (response: Response<{{operationName}}Response>) => void) => {
            return this._client.subscribe({
                operationName: "{{operationName}}",
                isLiveQuery: false,
                {{#if hasInput}}input: options.input,{{/if}}
                abortSignal: options.abortSignal,
            }, (result) => cb(this.resultToResponse<{{operationName}}Response>(result)));
        },
    {{/each}}
    }
    {{/unless}}{{/if}}
    {{#if hasLiveQueries }}{{#unless reactNative}}
        public liveQuery = {
        {{#each liveQueries }}
            {{operationName}}: (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>, cb: (response: Response<{{operationName}}Response>) => void) => {
                return this._client.subscribe({
                    operationName: "{{operationName}}",
                    isLiveQuery: true,
                    {{#if hasInput}}input: options.input,{{/if}}
                    abortSignal: options.abortSignal,
                }, (result) => cb(this.resultToResponse<{{operationName}}Response>(result)));
            },
        {{/each}}
        }
    {{/unless}}{{/if}}

    {{#if hasS3Provider}}
    public uploadFiles = async (config: UploadConfig): Promise<Response<UploadResponse[]>> => {
        const result = await this._client.uploadFiles(config);

		if (result.status === "ok") {
			return {
				status: "ok",
				body: result.fileKeys.map((key) => ({key})),
			};
		}

        return {
			status: result.status,
			message: result.errors[0].message
		};
    };
    {{/if}}
   
    public fetchUser = async (revalidate?: boolean): Promise<User | null> => {
		try {
			const user = await this._client.fetchUser(null, revalidate);

			if (user) {
				this.setUser(user);
				return this.user;
			}
		} catch {}

		this.setUser(null);
		return null;
    };

    {{#if hasAuthProviders}}
    public login : Record<AuthProviderId, AuthProvider['login']> = {
        {{#each authProviders}}
        {{.}}: (redirectURI?: string): void => {
            this._client.login(AuthProviderId.{{.}}, redirectURI)
        },
        {{/each}}
    }

    public authProviders: Array<AuthProvider> = [
        {{#each authProviders}}
        {
            id: AuthProviderId.{{.}},
            login: this.login[AuthProviderId.{{.}}]
        },
        {{/each}}
    ]

    public logout = async (options?: LogoutOptions): Promise<boolean> => {
        const response = await this._client.logout(options);

        this.setUser(null);
        this.logoutCallback?.()

        return response
    }
    {{/if}}
}
`;
