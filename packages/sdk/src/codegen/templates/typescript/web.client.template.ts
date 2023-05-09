//language=handlebars
export const template = `
import type { {{ modelImports }} } from "./models";
import type { RequestOptions, UserListener, Response } from "@wundergraph/sdk/server";
import type { User, Role } from "./wundergraph.server";
import {
	Client as WunderGraphClient,
	ClientConfig,
	UploadRequestOptions,
	ClientResponse as Result,
  LogoutOptions
} from "@wundergraph/sdk/client";
export const WUNDERGRAPH_S3_ENABLED = {{hasS3Providers}};
export const WUNDERGRAPH_AUTH_ENABLED = {{hasAuthProviders}};
{{#if hasS3Providers}}
export interface UploadResponse { key: string }
export enum S3Provider {
    {{#each s3Providers }}
    "{{name}}" = "{{name}}",
    {{/each}}
}
export type UploadConfig = UploadRequestOptions<S3Provider>
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

export class Client {
    constructor(config: Partial<ClientConfig> = {}) {
        const {
            baseURL = "{{ baseURL }}",
            ...rest
        } = config
        
        this._client = new WunderGraphClient({
            baseURL,
            applicationHash: "{{ applicationHash }}",
            sdkVersion: "{{ sdkVersion }}",
            ...rest
        });
        this.user = null;
    }
    private _client: WunderGraphClient;
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
    if (result.error) {
      return {
        status: 'error',
        message: result.error.message
      }
    }

    return {
      status: 'ok',
      body: {
        data: result.data
      }
    } as Response<any>;
	};
    {{#if hasQueries}}
    public query = {
        {{#each queries}}
        {{operationName}}: async (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{responseTypename}}>) => {
            const result = await this._client.query({
                operationName: "{{operationName}}",
                input: options.input,
                abortSignal: options.abortSignal,
            })
            return this.resultToResponse<{{responseTypename}}>(result)
        },
        {{/each}}
    }
    {{/if}}
    {{#if hasMutations}}
    public mutation = {
    {{#each mutations}}
        {{operationName}}: async (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{responseTypename}}>) => {
            const result =  await this._client.mutate({
                operationName: "{{operationName}}",
                input: options.input,
                abortSignal: options.abortSignal,
            })
            return this.resultToResponse<{{responseTypename}}>(result)
        },
    {{/each}}
    }
    {{/if}}
    {{#if hasSubscriptions}}{{#unless reactNative}}
    public subscription = {
    {{#each subscriptions}}
        {{operationName}}: (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{responseTypename}}>, cb: (response: Response<{{responseTypename}}>) => void) => {
            return this._client.subscribe({
                operationName: "{{operationName}}",
                liveQuery: false,
                input: options.input,
                abortSignal: options.abortSignal,
            }, (result) => cb(this.resultToResponse<{{responseTypename}}>(result)));
        },
    {{/each}}
    }
    {{/unless}}{{/if}}
    {{#if hasLiveQueries }}{{#unless reactNative}}
        public liveQuery = {
        {{#each liveQueries }}
            {{operationName}}: (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{responseTypename}}>, cb: (response: Response<{{responseTypename}}>) => void) => {
                return this._client.subscribe({
                    operationName: "{{operationName}}",
                    liveQuery: true,
                    input: options.input,
                    abortSignal: options.abortSignal,
                }, (result) => cb(this.resultToResponse<{{responseTypename}}>(result)));
            },
        {{/each}}
        }
    {{/unless}}{{/if}}
    {{#if hasS3Providers}}
    public uploadFiles = async (config: UploadConfig): Promise<Response<UploadResponse[]>> => {
      try {
        const result = await this._client.uploadFiles(config);
        return {
          status: "ok",
          body: result.fileKeys.map((key) => ({key})),
        };
      } catch (e) {
        return {
          status: 'error',
          message: e.message
        }
      }
    };
    {{/if}}
   
    public fetchUser = async (revalidate?: boolean): Promise<User | null> => {
		try {
			const user = await this._client.fetchUser<User>({
        revalidate
      });
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
