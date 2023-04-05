import { Client, ClientConfig, OperationsDefinition } from '@wundergraph/sdk/client';
import fetch from 'node-fetch';

export type Queries = {
	Weather: {
		data: any;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {
	SetNameWithoutAuth: {
		input: { name: string };
		data: { id: string };
		requiresAuthentication: false;
	};
	SetName: {
		input: { name: string };
		data: { id: string };
		requiresAuthentication: true;
	};
};

export type Subscriptions = {
	Countdown: {
		input: { from: number };
		data: { count: number };
		requiresAuthentication: false;
	};
};

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, string, {}, 'github'> {}

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
