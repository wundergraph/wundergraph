import { createSvelteClient } from '../src/lib';
import { Client } from '@wundergraph/sdk/client';
import type { ClientResponseError, OperationsDefinition, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { get } from 'svelte/store';
import type { CreateQueryResult } from '@tanstack/svelte-query';

interface Operations extends OperationsDefinition {
	queries: {
		Weather: {
			input: {
				city: string;
			};
			data: any;
			requiresAuthentication: boolean;
		};
	};
	subscriptions: {
		Weather: {
			input: {
				forCity: string;
			};
			data: any;
			requiresAuthentication: boolean;
		};
	};
	mutations: {
		CreateUser: {
			input: {
				name: string;
			};
			data: any;
			requiresAuthentication: boolean;
		};
	};
}

const { createSubscription, createQuery, createMutation, getUser, queryKey } = createSvelteClient<Operations>(
	new Client({
		baseURL: 'http://localhost:8080',
		applicationHash: 'my-application-hash',
		sdkVersion: '0.0.0',
	})
);

const query = createQuery({
	enabled: true,
	operationName: 'Weather',
	input: {
		city: 'Berlin',
	},
});

const { data: queryData, error: queryError } = get(query);

expectType<Operations['queries']['Weather']['data']>(queryData);
expectType<ClientResponseError | null>(queryError);

const subscription = createSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

const { data: subData, error: subError } = get(subscription);
expectType<Operations['subscriptions']['Weather']['data']>(subData);
expectType<ClientResponseError | null>(subError);

const mutation = createMutation({
	operationName: 'CreateUser',
});

const { data: mutData, error: mutError, mutate, mutateAsync } = get(mutation);

expectType<Operations['mutations']['CreateUser']['data']>(mutData);
expectType<ClientResponseError | null>(mutError);

expectType<void>(
	mutate({
		name: 'John Doe',
	})
);

expectType<Promise<any>>(
	mutateAsync({
		name: 'John Doe',
	})
);

expectType<CreateQueryResult<User<string>, ClientResponseError>>(getUser());
expectType<CreateQueryResult<User<string>, ClientResponseError>>(
	getUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

expectType<('Weather' | { city: string } | undefined)[]>(
	queryKey({ operationName: 'Weather', input: { city: 'Berlin' } })
);
