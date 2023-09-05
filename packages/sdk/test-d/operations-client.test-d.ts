import { expectType } from 'tsd';
import { ClientOperationErrors, ClientResponse } from '../src/client';
import { InternalOperationsDefinition, OperationsClient } from '../src/server/operations-client';

type Queries = {
	RequiredInput: {
		input: { lat: number };
		response: { data: { id: string }; error: ClientOperationErrors };
	};
	NoInput: {
		input?: undefined;
		response: { data: { id: string }; error: ClientOperationErrors };
	};
	OptionalInput: {
		input?: {
			id?: number;
		};
		response: { data: { id: string }; error: ClientOperationErrors };
	};
};

type Mutations = {
	RequiredInput: {
		input: { lat: number };
		response: { data: { id: string }; error: ClientOperationErrors };
	};
	NoInput: {
		input?: undefined;
		response: { data: { id: string }; error: ClientOperationErrors };
	};
	OptionalInput: {
		input?: {
			id?: number;
		};
		response: { data: { id: string }; error: ClientOperationErrors };
	};
};

type Subscriptions = {
	RequiredInput: {
		input: { lat: number };
		response: { data: { id: string }; error: ClientOperationErrors };
	};
	NoInput: {
		input?: undefined;
		response: { data: { id: string }; error: ClientOperationErrors };
	};
	OptionalInput: {
		input?: {
			id?: number;
		};
		response: { data: { id: string }; error: ClientOperationErrors };
	};
};

type InternalOperations = InternalOperationsDefinition<Queries, Mutations, Subscriptions>;

const client = new OperationsClient<InternalOperations>({
	baseURL: 'https://api.com',
	clientRequest: {
		headers: new Headers(),
		method: 'GET',
		requestURI: 'https://api.com',
	},
});

// Queries

expectType<Promise<ClientResponse<{ id: string }, ClientOperationErrors>>>(
	client.query({
		operationName: 'RequiredInput',
		input: { lat: 1 },
	})
);

expectType<Promise<ClientResponse<{ id: string }, ClientOperationErrors>>>(
	client.query({
		operationName: 'NoInput',
	})
);

expectType<Promise<ClientResponse<{ id: string }, ClientOperationErrors>>>(
	client.query({
		operationName: 'OptionalInput',
	})
);

// Mutations

expectType<Promise<ClientResponse<{ id: string }, ClientOperationErrors>>>(
	client.mutate({
		operationName: 'RequiredInput',
		input: { lat: 1 },
	})
);

expectType<Promise<ClientResponse<{ id: string }, ClientOperationErrors>>>(
	client.mutate({
		operationName: 'NoInput',
	})
);

expectType<Promise<ClientResponse<{ id: string }, ClientOperationErrors>>>(
	client.mutate({
		operationName: 'OptionalInput',
	})
);

// Subscriptions

expectType<Promise<AsyncGenerator<ClientResponse<{ id: string }, ClientOperationErrors>>>>(
	client.subscribe({
		operationName: 'RequiredInput',
		input: { lat: 1 },
	})
);

expectType<Promise<AsyncGenerator<ClientResponse<{ id: string }, ClientOperationErrors>>>>(
	client.subscribe({
		operationName: 'NoInput',
	})
);

expectType<Promise<AsyncGenerator<ClientResponse<{ id: string }, ClientOperationErrors>>>>(
	client.subscribe({
		operationName: 'OptionalInput',
	})
);
