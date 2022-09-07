import {
	QueryResultOK,
	ResultCancelled,
	ResultError,
	ResultLazy,
	ResultLoading,
	ResultNone,
	ResultOK,
	ResultPartial,
	ResultRequiresAuthentication,
	SubscriptionResultOK,
} from '@wundergraph/sdk/client';

interface HookResultOK<Data> extends ResultOK<Data> {
	isLoading: false;
	isSuccess: true;
	isError: false;
}

interface HookResultPartial<Data> extends ResultPartial<Data> {
	isLoading: false;
	isSuccess: true;
	isError: true;
}

interface HookResultLazy extends ResultLazy {
	isLoading: false;
	isSuccess: false;
	isError: false;
}

interface HookResultError extends ResultError {
	isLoading: false;
	isSuccess: false;
	isError: true;
}

interface HookResultLoading extends ResultLoading {
	isLoading: true;
	isSuccess: false;
	isError: false;
}

interface HookResultCancelled extends ResultCancelled {
	isLoading: false;
	isSuccess: false;
	isError: false;
}

interface HookResultNone extends ResultNone {
	isLoading: false;
	isSuccess: false;
	isError: false;
}

interface HookResultRequiresAuthentication extends ResultRequiresAuthentication {
	isLoading: false;
	isSuccess: false;
	isError: true;
}

interface UseQueryResultOK<Data> extends QueryResultOK<Data> {
	isLoading: false;
	isSuccess: true;
	isError: false;
}

export type UseQueryResult<Data> =
	| UseQueryResultOK<Data>
	| HookResultPartial<Data>
	| HookResultLazy
	| HookResultError
	| HookResultLoading
	| HookResultCancelled
	| HookResultNone
	| HookResultRequiresAuthentication;

export type UseMutationResult<Data> =
	| HookResultNone
	| HookResultLoading
	| HookResultOK<Data>
	| HookResultPartial<Data>
	| HookResultError
	| HookResultRequiresAuthentication;

interface UseSubscriptionResultOK<Data> extends SubscriptionResultOK<Data> {
	isLoading: false;
	isSuccess: true;
	isError: false;
}

export type UseSubscriptionResult<Data> =
	| UseSubscriptionResultOK<Data>
	| HookResultError
	| HookResultPartial<Data>
	| HookResultLoading
	| HookResultNone
	| HookResultRequiresAuthentication;
