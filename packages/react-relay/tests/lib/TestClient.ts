import { Client, ClientConfig, GraphQLError, OperationsDefinition } from '@wundergraph/sdk/client';
import fetch from 'node-fetch';

export type Queries = {
	Weather: {
		response: { data: any };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {
	SetNameWithoutAuth: {
		input: { name: string };
		response: { data: { id: string }; error: GraphQLError };
		requiresAuthentication: false;
	};
	SetName: {
		input: { name: string };
		response: { data: { id: string }; error: GraphQLError };
		requiresAuthentication: true;
	};
};

export type Subscriptions = {
	Countdown: {
		input: { from: number };
		response: { data: { count: number } };
		requiresAuthentication: false;
	};
};

export type LiveQueries = {};

export interface Operations
	extends OperationsDefinition<Queries, Mutations, Subscriptions, LiveQueries, string, {}, 'github'> {}

export function sleep(time: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, time));
}

export const createClient = (overrides?: Partial<ClientConfig>) => {
	return new Client({
		sdkVersion: '1.0.0',
		baseURL: 'https://api.com',
		applicationHash: '123',
		customFetch: fetch as any,
		operationMetadata: {
			Weather: {
				requiresAuthentication: false,
			},
			SetName: {
				requiresAuthentication: true,
			},
			SetNameWithoutAuth: {
				requiresAuthentication: false,
			},
			Countdown: {
				requiresAuthentication: false,
			},
		},
		...overrides,
	});
};
