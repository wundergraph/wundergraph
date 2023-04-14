import type { Client, ClientResponse, ResponseError, SubscriptionRequestOptions } from '@wundergraph/sdk/client';
import {
	PreloadedQuery,
	usePreloadedQuery as useRelayPreloadedQuery,
	useRelayEnvironment,
	RelayEnvironmentProvider,
	fetchQuery as relayFetchQuery,
} from 'react-relay';
import React, { useEffect, useState, useRef, ComponentType, useMemo, ReactNode, FC } from 'react';
import { withRelay, hydrateRelayEnvironment } from 'relay-nextjs';
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
import { WiredOptions, WiredProps } from 'relay-nextjs/wired/component';
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

	const useSubscribeTo = (
		props: UseSubscribeToProps
	): {
		isLoading: boolean;
		isSubscribed: boolean;
		data?: ClientResponse['data'];
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

	const usePreloadedQuery = <TQuery extends OperationType>(
		gqlQuery: Parameters<typeof useRelayPreloadedQuery>[0],
		preloadedQuery: PreloadedQuery<TQuery>,
		options?: Parameters<typeof useRelayPreloadedQuery>[2] &
			Omit<UseSubscribeToProps, 'operationName' | 'input' | 'enabled' | 'abortSignal'>
	): TQuery['response'] => {
		const { UNSTABLE_renderPolicy, ...subscriptionOptions } = options || {};
		const data = useRelayPreloadedQuery(gqlQuery, preloadedQuery, { UNSTABLE_renderPolicy });
		const environment = useRelayEnvironment();

		const { id, variables } = preloadedQuery;

		const { data: liveData } = useSubscribeTo({
			operationName: `relay/${id}`,
			input: variables,
			...subscriptionOptions,
			enabled: options?.liveQuery ?? false,
			liveQuery: options?.liveQuery ?? false,
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

	const useEnvironment = (initialRecords?: RecordMap) => {
		const store = useMemo(() => initEnvironment(initialRecords), [initialRecords]);
		return store;
	};

	const WunderGraphRelaySSRProvider: FC<{
		initialRecords: RecordMap;
		children: ReactNode;
	}> = ({ initialRecords, children }) => {
		const environment = useEnvironment(initialRecords);
		return <RelayEnvironmentProvider environment={environment}>{children}</RelayEnvironmentProvider>;
	};

	const fetchWunderGraphSSRQuery = async <T extends OperationType>(
		query: GraphQLTaggedNode,
		variables: T['variables'],
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

	return {
		usePreloadedQuery,
		initEnvironment,
		useEnvironment,
		WunderGraphRelaySSRProvider,
		fetchWunderGraphSSRQuery,
	};
};
