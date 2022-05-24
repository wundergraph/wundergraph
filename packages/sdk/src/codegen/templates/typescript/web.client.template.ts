//language=handlebars
export const template = `
import type { {{ modelImports }} } from "./models";
import type { RequestOptions, ClientConfig, UserListener, Response, FetchConfig, Headers } from "@wundergraph/sdk";
import type { User } from "./wundergraph.server";

export const WUNDERGRAPH_S3_ENABLED = {{hasS3Provider}};
export const WUNDERGRAPH_AUTH_ENABLED = {{hasAuthProviders}};

{{#if hasS3Provider}}
export interface UploadResponse { key: string }

export interface UploadConfig {
    provider: S3Provider;
    formData: FormData;
    abortSignal?: AbortSignal;
}
{{/if}}

{{#if hasS3Provider}}
export enum S3Provider {
    {{#each s3Provider }}
    "{{name}}" = "{{name}}",
    {{/each}}
}
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

export class Client {
    constructor(config?: ClientConfig) {
        this.baseURL = config?.baseURL || this.baseURL;
        this.extraHeaders = config?.extraHeaders;
        this.user = null;
        this.customFetch = config?.customFetch;
    }
    private logoutCallback: undefined | (() => void);
    public setLogoutCallback(cb: ()=>void){
        this.logoutCallback = cb;
    }
    public setExtraHeaders = (headers: Headers) => {
        this.extraHeaders = headers;
    }
    private customFetch?: ((input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>);
    private extraHeaders?: Headers;
    private readonly baseURL: string = "{{ baseURL }}";
    private readonly applicationHash: string = "{{ applicationHash }}"
    private readonly applicationPath: string = "{{ applicationPath }}"
    private readonly sdkVersion: string = "{{ sdkVersion }}"
    private csrfToken: string | undefined;
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
    {{#if hasQueries}}
    public query = {
        {{#each queries}}
        {{operationName}}: async (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>) => {
            return await this.doFetch<{{operationName}}Response>({
                method: "GET",
                path: "{{path}}",
                input: options.input,
                abortSignal: options.abortSignal,
            })
        },
        {{/each}}
    }
    {{/if}}
    {{#if hasMutations}}
    public mutation = {
    {{#each mutations}}
        {{operationName}}: async (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>) => {
            return await this.doFetch<{{operationName}}Response>({
                method: "POST",
                path: "{{path}}",
                input: options.input,
                abortSignal: options.abortSignal,
            })
        },
    {{/each}}
    }
    {{/if}}
    {{#if hasSubscriptions}}{{#unless reactNative}}
    public subscription = {
    {{#each subscriptions}}
        {{operationName}}: (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>, cb: (response: Response<{{operationName}}Response>) => void) => {
            return this.startSubscription<{{operationName}}Response>({
                method: "GET",
                path: "{{path}}",
                input: options.input,
                abortSignal: options.abortSignal,
            },cb);
        },
    {{/each}}
    }
    {{/unless}}{{/if}}
    {{#if hasLiveQueries }}{{#unless reactNative}}
        public liveQuery = {
        {{#each liveQueries }}
            {{operationName}}: (options: RequestOptions<{{#if hasInput}}{{operationName}}Input{{else}}never{{/if}},{{operationName}}Response>, cb: (response: Response<{{operationName}}Response>) => void) => {
                return this.startSubscription<{{operationName}}Response>({
                    method: "GET",
                    path: "{{path}}",
                    input: options.input,
                    abortSignal: options.abortSignal,
                    liveQuery: true,
                },cb);
            },
        {{/each}}
        }
    {{/unless}}{{/if}}
    {{#if hasS3Provider}}
    public uploadFiles = async (config: UploadConfig): Promise<Response<UploadResponse[]>> => {
        try {
            // pass only files
            config.formData.forEach((value, key) => {
							if (!(value instanceof Blob)){
							delete config.formData[key];
						}
			});
            const baseHeaders: Headers = {
                ...this.extraHeaders,
                "WG-SDK-Version": this.sdkVersion,
            };
            const params = this.queryString({
                wg_api_hash: this.applicationHash,
            })
            if (this.csrfToken === undefined) {
                const f = this.customFetch || fetch;
                const res = await f(this.baseURL + "/" + this.applicationPath + "/auth/cookie/csrf", {
                    headers: {
                        ...baseHeaders,
                        Accept: "text/plain",
                    },
                    credentials: "include",
                    mode: "cors",
                });
                this.csrfToken = await res.text();
            }
            const headers: Headers = {
                ...baseHeaders,
                Accept: "application/json",
                "WG-SDK-Version": this.sdkVersion,
            };
            if (this.csrfToken) {
                headers["X-CSRF-Token"] = this.csrfToken;
            }
            const body = config.formData;
            const f = this.customFetch || fetch;
            const res = await f(
                this.baseURL + "/" + this.applicationPath + "/s3/" + config.provider + "/upload" + params,
                {
                    headers,
                    body,
                    method: "POST",
                    signal: config.abortSignal,
                    credentials: "include",
                    mode: "cors",
                }
            );
            if (res.status === 200) {
                const json = await res.json();
                return {
                    status: "ok",
                    body: json,
                };
            }
            throw new Error(\`could not upload files, status: \${res.status}\`);
        } catch (e: any) {
            return {
                status: "error",
                message: e.toString(),
            };
        }
    };
    {{/if}}
    private doFetch = async <T>(fetchConfig: FetchConfig): Promise<Response<T>> => {
        try {
            const params =
                fetchConfig.method !== "POST"
                    ? this.queryString({
                        wg_variables: fetchConfig.input,
                        wg_api_hash: this.applicationHash,
                    })
                    : "";
            if (fetchConfig.method === "POST" && this.csrfToken === undefined) {
                const f = this.customFetch || fetch;
                const res = await f(this.baseURL + "/" + this.applicationPath + "/auth/cookie/csrf", {
                    credentials: "include",
                    mode: "cors",
                });
                this.csrfToken = await res.text();
            }
            const headers: Headers = {
                ...this.extraHeaders,
                Accept: "application/json",
                "WG-SDK-Version": this.sdkVersion,
            };
            if (fetchConfig.method === "POST") {
                if (this.csrfToken) {
                    headers["X-CSRF-Token"] = this.csrfToken;
                }
            }
            const body = fetchConfig.method === "POST" ? JSON.stringify(fetchConfig.input) : undefined;
            const data = await this.fetch(
                this.baseURL + "/" + this.applicationPath + "/operations/" + fetchConfig.path + params,
                {
                    headers,
                    body,
                    method: fetchConfig.method,
                    signal: fetchConfig.abortSignal,
                    credentials: "include",
                    mode: "cors",
                }
            );
            return {
                status: "ok",
                body: data,
            };
        } catch (e: any) {
            return {
                status: "error",
                message: e,
            };
        }
    };
    private inflight: { [key: string]: { reject: (reason?: any) => void, resolve: (value: globalThis.Response | PromiseLike<globalThis.Response>) => void }[] } = {};
    private fetch = (input: globalThis.RequestInfo, init?: RequestInit): Promise<any> => {
        const key = JSON.stringify({input,init});
        return new Promise<any>(async (resolve, reject) => {
            if (this.inflight[key]){
                this.inflight[key].push({resolve,reject});
                return
            }
            if (init?.method === "GET"){
            	this.inflight[key] = [{resolve,reject}];
            }
            try {
                const f = this.customFetch || fetch;
                const res = await f(input,init);
                const inflight = this.inflight[key] || [{resolve,reject}];
                delete this.inflight[key];
                if (res.status === 200){
                    const json = await res.json();
                    inflight.forEach(cb => cb.resolve(json));
                    return;
                }
                if (res.status === 400) {
                    inflight.forEach(cb => cb.reject("bad request"))
                    return;
                }
                if (res.status >= 401 && res.status <= 499){
                    this.csrfToken = undefined;
                    inflight.forEach(cb => cb.reject("unauthorized"));
                    this.fetchUser();
                    return;
                }
                if (res.status >= 500 && res.status <= 599){
                    inflight.forEach(cb => cb.reject("server error"));
                    return;
                }
                inflight.forEach(cb => cb.reject("unknown error"));
            } catch (e: any){
                const inflight = this.inflight[key];
                delete this.inflight[key];
                inflight.forEach(cb => cb.reject(e))
            }
        })
    }
    {{#if hasSubscriptionsOrLiveQueries }}{{#unless reactNative}}
    private startSubscription = <T>(fetchConfig: FetchConfig, cb: (response: Response<T>) => void) => {
        (async () => {
            try {
                const params = this.queryString({
                    wg_variables: fetchConfig.input,
                    wg_live: fetchConfig.liveQuery === true ? true : undefined,
                });
                const f = this.customFetch || fetch;
                const response = await f(this.baseURL + "/" + this.applicationPath + "/operations/" + fetchConfig.path + params, {
                    headers: {
                        ...this.extraHeaders,
                        "Content-Type": "application/json",
                        "WG-SDK-Version": this.sdkVersion,
                    },
                    method: fetchConfig.method,
                    signal: fetchConfig.abortSignal,
                    credentials: "include",
                    mode: "cors",
                });
                if (response.status === 401){
                    this.csrfToken = undefined;
                    return;
                }
                if (response.status !== 200 || response.body == null) {
                    return
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let message: string = "";
                while (true) {
                    const {value, done} = await reader.read()
                    if (done) break;
                    if (!value) continue;
                    message += decoder.decode(value);
                    if (message.endsWith("\\n\\n")) {
                        cb({
                            status: "ok",
                            body: JSON.parse(message.substring(0, message.length - 2)),
                        });
                        message = "";
                    }
                }
            } catch (e: any) {
                cb({
                    status: "error",
                    message: e,
                });
            }
        })();
    }
    {{/unless}}{{/if}}
    private queryString = (input?: Object): string => {
        if (!input) {
            return ""
        }
        const query = (Object.keys(input) as Array<keyof typeof input>)
            // @ts-ignore
            .filter(key => input[key] !== undefined && input[key] !== "")
            .map(key => {
                const value = typeof input[key] === "object" ? JSON.stringify(input[key]) : input[key];
                const encodedKey = encodeURIComponent(key);
                // @ts-ignore
                const encodedValue = encodeURIComponent(value);
                return \`\${encodedKey}=\${encodedValue}\`
            }).join("&");
        return query === "" ? query : "?" + query;
    }
    public fetchUser = async (revalidate?: boolean): Promise<User | null> => {
        try {
            const revalidateTrailer = revalidate === undefined ? "" : "?revalidate=true"
            const f = this.customFetch || fetch;
            const response = await f(this.baseURL + "/" + this.applicationPath + "/auth/cookie/user" + revalidateTrailer, {
                headers: {
                    ...this.extraHeaders,
                    "Content-Type": "application/json",
                    "WG-SDK-Version": this.sdkVersion,
                },
                method: "GET",
                credentials: "include",
                mode: "cors",
            });
            if (response.status === 200) {
                const user = await response.json();
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
            this.startLogin(AuthProviderId.{{.}},redirectURI)
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
    public logout = async (options?: LogoutOptions) :Promise<boolean> => {
        const f = this.customFetch || fetch;
        const response = await f(this.baseURL + "/" + this.applicationPath + "/auth/cookie/user/logout" + this.queryString(options), {
            headers: {
                ...this.extraHeaders,
                "Content-Type": "application/json",
                "WG-SDK-Version": this.sdkVersion,
            },
            method: "GET",
            credentials: "include",
            mode: "cors",
        });
        this.setUser(null);
        if (this.logoutCallback){
            this.logoutCallback();
        }
        return response.status === 200
    }
    private startLogin = (providerID: AuthProviderId, redirectURI?: string) => {
        const query = this.queryString({
            redirect_uri: redirectURI || window.location.toString(),
        });
        window.location.replace(\`\${this.baseURL}/\${this.applicationPath}/auth/cookie/authorize/\${providerID}\${query}\`);
    }
    {{/if}}
}
`;
