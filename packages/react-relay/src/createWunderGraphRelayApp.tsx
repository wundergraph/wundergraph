import type { Client, ClientResponse, ResponseError, SubscriptionRequestOptions } from '@wundergraph/sdk/client';
import {
	useRelayEnvironment,
	RelayEnvironmentProvider,
	fetchQuery as relayFetchQuery,
	PreloadedQuery,
	usePreloadedQuery as useRelayPreloadedQuery,
} from 'react-relay';
import React, { useEffect, useState, useRef, useMemo, ReactNode, FC } from 'react';
import {
	CacheConfig,
	Environment,
	FetchFunction,
	FetchQueryFetchPolicy,
	GraphQLTaggedNode,
	Network,
	Observable,
	OperationType,
	RecordSource,
	Store,
	SubscribeFunction,
	createOperationDescriptor,
	getRequest,
} from 'relay-runtime';
import { RecordMap } from 'relay-runtime/lib/store/RelayStoreTypes';

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ResponseError): void;
	onAbort?(): void;
}

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	enabled?: Boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ResponseError): void;
}

export interface CreateWunderGraphRelayOptions {
	client: Client;
}

export const createWunderGraphRelayApp = ({ client }: CreateWunderGraphRelayOptions) => {
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

	const useSubscribeTo = <TQuery extends OperationType>(
		props: UseSubscribeToProps
	): {
		isLoading: boolean;
		isSubscribed: boolean;
		data?: TQuery['response'];
		error?: ClientResponse['error'];
	} => {
		const { operationName, input, enabled, liveQuery, subscribeOnce, onSuccess, onError } = props;
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

	const useLiveQuery = <TQuery extends OperationType>({
		query,
		queryReference,
		enabled = true,
		options = {},
	}: {
		query: GraphQLTaggedNode;
		queryReference: PreloadedQuery<TQuery>;
		enabled?: boolean;
		options?: Omit<UseSubscribeToProps, 'operationName' | 'input' | 'enabled' | 'abortSignal' | 'liveQuery'>;
	}) => {
		const data = useRelayPreloadedQuery(query, queryReference);
		const { id, variables } = queryReference;
		const request = getRequest(query);
		const operationDescriptor = createOperationDescriptor(request, variables);
		const environment = useRelayEnvironment();

		const { data: liveData, ...subscriptionResponse } = useSubscribeTo<TQuery>({
			operationName: `relay/${id}`,
			input: variables,
			...options,
			enabled: enabled ?? false,
			liveQuery: enabled ?? false,
		});

		useEffect(() => {
			if (liveData) {
				environment.commitPayload(operationDescriptor, liveData);
			}
		}, [liveData]);

		return {
			...subscriptionResponse,
			data: data,
		};
	};

	let relayEnvironment: Environment;

	const createEnvironment = () => {
		return new Environment({
			network: Network.create(fetchQuery, subscribe),
			store: new Store(new RecordSource()),
		});
	};

	const initEnvironment = (initialRecords?: RecordMap) => {
		const environment = relayEnvironment ?? createEnvironment();

		if (initialRecords) {
			environment.getStore().publish(new RecordSource(initialRecords));
		}
		// For SSG and SSR always create a new Relay environment
		if (typeof window === 'undefined') return environment;
		// Create the Relay environment once in the client
		if (!relayEnvironment) relayEnvironment = environment;

		return relayEnvironment;
	};

	const getEnvironment = () => initEnvironment();

	const useEnvironment = (initialRecords?: RecordMap) => {
		const store = useMemo(() => initEnvironment(initialRecords), [initialRecords]);
		return store;
	};

	const WunderGraphRelayProvider: FC<{
		initialRecords?: RecordMap;
		children: ReactNode;
	}> = ({ initialRecords, children }) => {
		const environment = useEnvironment(initialRecords);
		return <RelayEnvironmentProvider environment={environment}>{children}</RelayEnvironmentProvider>;
	};

	const fetchWunderGraphSSRQuery = async <T extends OperationType>(
		query: GraphQLTaggedNode,
		variables: T['variables'] = {},
		cacheConfig?: {
			networkCacheConfig?: CacheConfig | null | undefined;
			fetchPolicy?: FetchQueryFetchPolicy | null | undefined;
		} | null
	): Promise<{ initialRecords: RecordMap; queryResponse?: Awaited<T['response']> }> => {
		const environment = initEnvironment();
		const queryResponse = await relayFetchQuery(environment, query, variables, cacheConfig).toPromise();
		const initialRecords = environment.getStore().getSource().toJSON();

		return {
			queryResponse,
			initialRecords,
		};
	};

	/**
	 * Experimental utility to fetch queries at build time
	 * This function doesn't use Relay store & should be only used when you don't have Relay on the client side (working with frameworks like Astro or 11ty)
	 */
	const fetchWunderGraphSSGQuery = async <T extends OperationType>(
		query: GraphQLTaggedNode,
		variables: T['variables']
	): Promise<Awaited<T['response']>> => {
		const concreteRequest = getRequest(query);

		const operationDescriptor = createOperationDescriptor(concreteRequest, variables);

		const id = operationDescriptor?.request?.node?.params?.id;

		const { data, error } = await client.query({
			operationName: `relay/${id}`,
			input: variables,
		});

		if (error) {
			throw Error(error);
		}

		return data;
	};

	return {
		WunderGraphRelayProvider,
		fetchWunderGraphSSRQuery,
		fetchWunderGraphSSGQuery,
		useLiveQuery,
		getEnvironment,
	};
};
