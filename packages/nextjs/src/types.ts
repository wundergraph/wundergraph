export interface WithWunderGraphOptions {
	baseURL?: string;
	logPrerenderTime?: boolean;
	disableFetchUserServerSide?: boolean;
	disableFetchUserClientSide?: boolean;
	disableFetchUserOnWindowFocus?: boolean;
}

export interface QueryArgs {
	disableSSR?: boolean;
	lazy?: boolean;
	debounceMillis?: number;
	refetchOnWindowFocus?: boolean;
}

export interface InternalQueryArgs extends QueryArgs {
	abortSignal?: AbortSignal;
	subscribeOnce?: boolean;
}

export interface InternalQueryArgsWithInput<Input> extends InternalQueryArgs {
	input: Input;
}

export interface QueryArgsWithInput<Input> extends QueryArgs {
	input: Input;
}

export type QueryProps<Args extends QueryArgs = QueryArgs> = Args & {
	operationName: string;
};

export type SubscriptionProps<Args extends SubscriptionArgs = SubscriptionArgs> = Args & {
	operationName: string;
};

export interface SubscriptionArgs {
	stopOnWindowBlur?: boolean;
	debounceMillis?: number;
	disableSSR?: boolean;
}

export interface InternalSubscriptionArgs extends SubscriptionArgs {
	abortSignal?: AbortSignal;
	subscribeOnce?: boolean;
	isLiveQuery?: boolean;
}

export interface InternalSubscriptionArgsWithInput<Input> extends InternalSubscriptionArgs {
	input: Input;
}

export interface SubscriptionArgsWithInput<Input> extends SubscriptionArgs {
	input: Input;
}

export type MutationProps<Args extends MutationArgs = MutationArgs> = Args & {
	operationName: string;
};

export interface MutationArgs {
	refetchMountedOperationsOnSuccess?: boolean;
}

export interface InternalMutationArgs extends MutationArgs {
	abortSignal?: AbortSignal;
}

export interface InternalMutationArgsWithInput<Input> extends InternalMutationArgs {
	input: Input;
}

export interface MutationArgsWithInput<Input> extends MutationArgs {
	input: Input;
}

export interface GraphQLError {
	message: string;
	path?: ReadonlyArray<string | number>;
}

export interface ResultOK<Data> {
	status: 'ok';
	refetching?: boolean;
	data: Data;
}

export interface ResultRequiresAuthentication {
	status: 'requires_authentication';
}

export interface ResultNone {
	status: 'none';
}

export interface ResultLazy {
	status: 'lazy';
}

export interface ResultCancelled {
	status: 'cancelled';
}

export interface ResultLoading {
	status: 'loading';
}

export interface ResultPartial<Data> {
	status: 'partial';
	data: Data;
	errors: ReadonlyArray<GraphQLError>;
}

export interface ResultError {
	status: 'error';
	errors: ReadonlyArray<GraphQLError>;
}

export type SubscriptionResult<Data> =
	| SubscriptionResultOK<Data>
	| ResultError
	| ResultPartial<Data>
	| ResultLoading
	| ResultNone
	| ResultRequiresAuthentication;

export interface SubscriptionResultOK<Data> extends ResultOK<Data> {
	streamState: 'streaming' | 'stopped' | 'restarting';
}

export type QueryResult<Data> =
	| QueryResultOK<Data>
	| ResultPartial<Data>
	| ResultLazy
	| ResultError
	| ResultLoading
	| ResultCancelled
	| ResultNone
	| ResultRequiresAuthentication;

export interface QueryResultOK<Data> extends ResultOK<Data> {
	refetching?: boolean;
}

export type MutationResult<Data> =
	| ResultNone
	| ResultLoading
	| ResultOK<Data>
	| ResultPartial<Data>
	| ResultError
	| ResultRequiresAuthentication;

export type UploadResult = UploadResultOK | ResultError;

export interface UploadResultOK {
	status: 'ok';
	fileKeys: string[];
}

export interface UploadResponseError {
	status: 'error';
	message: string;
}

export interface UploadConfig<Provider extends string> {
	provider: Provider;
	files: FileList;
	abortSignal?: AbortSignal;
}
