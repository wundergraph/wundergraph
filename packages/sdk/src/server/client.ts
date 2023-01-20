export type Response<T> =
	| ResponseOK<T>
	| CachedResponse<T>
	| Refetch<T>
	| Lazy
	| Loading
	| Aborted
	| Error
	| None
	| RequiresAuthentication;

export interface ResponseOK<T> {
	status: 'ok';
	body: T;
}

export interface CachedResponse<T> {
	status: 'cached';
	body: T;
}

export interface RequiresAuthentication {
	status: 'requiresAuthentication';
}

export interface Loading {
	status: 'loading';
}

export interface Lazy {
	status: 'lazy';
}

export interface Refetch<T> extends ResponseOK<T> {
	refetching: true;
}

export interface Aborted {
	status: 'aborted';
}

export interface Error {
	status: 'error';
	message: string;
}

export interface None {
	status: 'none';
}

export interface UploadResponse {
	key: string;
}

export interface FetchConfig {
	method: 'GET' | 'POST';
	path: string;
	input?: Object;
	abortSignal?: AbortSignal;
	liveQuery?: boolean;
}

export interface MutateRequestOptions<Input = never> {
	input?: Input;
	abortSignal?: AbortSignal;
	refetchMountedQueriesOnSuccess?: boolean;
	lazy?: boolean;
}

export interface RequestOptions<Input = never, InitialState = never> {
	input?: Input;
	abortSignal?: AbortSignal;
	initialState?: InitialState;
	refetchOnWindowFocus?: boolean;
	lazy?: boolean;
}

export interface SubscriptionRequestOptions<Input = never> {
	input?: Input;
	abortSignal?: AbortSignal;
	stopOnWindowBlur?: boolean;
}

export type UserListener<User> = (user: User | null) => void;

export type Headers = { [key: string]: string };

export interface ClientConfig {
	baseURL?: string;
	extraHeaders?: Headers;
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
}
