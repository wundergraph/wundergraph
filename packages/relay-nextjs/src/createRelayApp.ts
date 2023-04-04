import type { Client, ClientResponse, ResponseError, SubscriptionRequestOptions } from '@wundergraph/sdk/client';
import { usePreloadedQuery, useRelayEnvironment } from 'react-relay/hooks';
import { useEffect, useState, useRef } from 'react';
import { hydrateRelayEnvironment } from 'relay-nextjs';
import {
	Environment,
	FetchFunction,
	Network,
	Observable,
	RecordSource,
	Store,
	SubscribeFunction,
	createOperationDescriptor,
	getRequest,
} from 'relay-runtime';

let clientEnv: Environment | undefined;

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ResponseError): void;
	onAbort?(): void;
}

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	enabled?: boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ResponseError): void;
}

export const createRelayApp = (client: Client) => {
	const fetchQuery: FetchFunction = async (params, variables) => {
		const { id, operationKind } = params;
		const response =
			operationKind === 'query'
				? await client.query({
						operationName: `relay/${id}`,
						input: variables,
				  })
				: await client.mutate({
						operationName: `relay/${id}`,
						input: variables,
				  });
		// TODO: figure out a better way to return errors for relay
		return {
			...response,
			errors: response.error ? [response.error] : [],
		};
	};

	const subscribe: SubscribeFunction = (params, variables) => {
		return Observable.create((sink) => {
			const { id } = params;
			const abort = new AbortController();
			client
				.subscribe(
					{
						operationName: `relay/${id}`,
						input: variables,
						abortSignal: abort.signal,
					},
					(response) => {
						const graphQLResponse = {
							...response,
							errors: response.error ? [response.error] : [],
						};
						// TODO: response data is unknown & it is throwing type error
						// @ts-expect-error
						sink.next(graphQLResponse);
					}
				)
				.catch((e) => {
					sink.error(e);
				});
			return () => {
				sink.complete();
				abort.abort();
			};
		});
	};

	const createServerNetwork = () => {
		return Network.create(fetchQuery, subscribe);
	};

	const createServerEnvironment = () => {
		return new Environment({
			network: createServerNetwork(),
			store: new Store(new RecordSource()),
			isServer: true,
		});
	};

	const createClientNetwork = () => {
		return Network.create(fetchQuery, subscribe);
	};

	const createClientEnvironment = () => {
		if (typeof window === 'undefined') return null;

		if (clientEnv == null) {
			clientEnv = new Environment({
				network: createClientNetwork(),
				store: new Store(new RecordSource()),
				isServer: false,
			});

			hydrateRelayEnvironment(clientEnv);
		}

		return clientEnv;
	};

	const subscribeTo = (options: SubscribeToOptions) => {
		const abort = new AbortController();
		const { onSuccess, onError, onResult, onAbort, ...subscription } = options;
		subscription.abortSignal = abort.signal;
		client.subscribe(subscription, onResult).catch(onError);
		return () => {
			onAbort?.();
			abort.abort();
		};
	};

	const useSubscribeTo = (
		props: UseSubscribeToProps
	): {
		isLoading: boolean;
		isSubscribed: boolean;
		data?: ClientResponse['data'];
		error?: ClientResponse['error'];
	} => {
		const { operationName, input, enabled = true, liveQuery = true, subscribeOnce, onSuccess, onError } = props;
		const startedAtRef = useRef<number | null>(null);
		const onSuccessRef = useRef(onSuccess);
		const onErrorRef = useRef(onError);

		const [state, setState] = useState({
			isLoading: false,
			isSubscribed: false,
		});

		const [data, setData] = useState<ClientResponse['data']>();
		const [error, setError] = useState<ClientResponse['error']>();

		useEffect(() => {
			if (enabled) {
				setState({ isLoading: true, isSubscribed: false });
			}
		}, [enabled]);

		useEffect(() => {
			let unsubscribe: ReturnType<typeof subscribeTo>;

			if (enabled) {
				unsubscribe = subscribeTo({
					operationName,
					input,
					liveQuery,
					subscribeOnce,
					onError(error) {
						setState({ isLoading: false, isSubscribed: false });
						onErrorRef.current?.(error);
						startedAtRef.current = null;
					},
					onResult(result) {
						if (!startedAtRef.current) {
							setState({ isLoading: false, isSubscribed: true });
							onSuccessRef.current?.(result);
							startedAtRef.current = new Date().getTime();
						}

						setData(result.data);
						setError(result.error);
					},
					onAbort() {
						setState({ isLoading: false, isSubscribed: false });
						startedAtRef.current = null;
					},
				});
			}

			return () => {
				unsubscribe?.();
			};
		}, [enabled, liveQuery, subscribeOnce]);

		return {
			data,
			error,
			...state,
		};
	};

	const useLivePreloadedQuery: typeof usePreloadedQuery = (gqlQuery, preloadedQuery, options) => {
		const data = usePreloadedQuery(gqlQuery, preloadedQuery, options);
		const environment = useRelayEnvironment();

		const { id, variables } = preloadedQuery;

		// TODO: figure out a way to handle error & other states with livequery
		const {
			data: liveData,
			error,
			isSubscribed,
			isLoading,
		} = useSubscribeTo({
			operationName: `relay/${id}`,
			input: variables,
		});

		useEffect(() => {
			if (liveData) {
				const request = getRequest(gqlQuery);
				const operationDescriptor = createOperationDescriptor(request, variables);
				environment.commitPayload(operationDescriptor, liveData);
			}
		}, [liveData]);

		return data;
	};

	return {
		createClientEnvironment,
		createClientNetwork,
		createServerEnvironment,
		createServerNetwork,
		useLivePreloadedQuery,
	};
};