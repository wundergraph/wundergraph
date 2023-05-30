import type { Client } from '@wundergraph/sdk/client';
import {
	CacheConfig,
	ConcreteRequest,
	Environment,
	FetchFunction,
	FetchQueryFetchPolicy,
	GraphQLResponse,
	GraphQLTaggedNode,
	Network,
	Observable,
	OperationType,
	RecordSource,
	Store,
	SubscribeFunction,
	fetchQuery as relayFetchQuery,
	VariablesOf,
} from 'relay-runtime';
import { RecordMap } from 'relay-runtime/lib/store/RelayStoreTypes';

export interface CreateWunderGraphRelayServerOptions {
	client: Client;
}

export interface SerializablePreloadedQuery<TRequest extends ConcreteRequest, TQuery extends OperationType> {
	params: TRequest['params'];
	variables: VariablesOf<TQuery>;
	response: GraphQLResponse;
}

export const createWunderGraphRelayServerApp = ({ client }: CreateWunderGraphRelayServerOptions) => {
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

	const fetchWunderGraphServerQuery = async <T extends OperationType>(
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

	return {
		fetchWunderGraphServerQuery,
	};
};
