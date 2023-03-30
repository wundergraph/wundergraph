import { createSvelteClient } from '../src/lib';
import { Client } from '@wundergraph/sdk/client';
import type { ResponseError, OperationsDefinition, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { get } from 'svelte/store';
import type { CreateQueryResult } from '@tanstack/svelte-query';

interface Operations extends OperationsDefinition {
	queries: {
		Weather: {
			input: {
				city: string;
			};
			response: { data?: { id: 1 }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
	subscriptions: {
		Weather: {
			input: {
				forCity: string;
			};
			response: { data?: { id: 1 }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
	mutations: {
		CreateUser: {
			input: {
				name: string;
			};
			response: { data?: { id: 1 }; error?: ResponseError };
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

expectType<Operations['queries']['Weather']['response']['data']>(queryData);
expectType<ResponseError | null | undefined>(queryError);

const subscription = createSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

const { data: subData, error: subError } = get(subscription);
expectType<Operations['subscriptions']['Weather']['response']['data']>(subData);
expectType<ResponseError | null | undefined>(subError);

const mutation = createMutation({
	operationName: 'CreateUser',
});

const { data: mutData, error: mutError, mutate, mutateAsync } = get(mutation);

expectType<Operations['mutations']['CreateUser']['response']['data']>(mutData);
expectType<ResponseError | null | undefined>(mutError);

expectType<void>(
	mutate({
		name: 'John Doe',
	})
);

expectType<Promise<{ id: 1 } | undefined>>(
	mutateAsync({
		name: 'John Doe',
	})
);

expectType<CreateQueryResult<User<string>, ResponseError>>(getUser());
expectType<CreateQueryResult<User<string>, ResponseError>>(
	getUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

expectType<('Weather' | { city: string } | undefined)[]>(
	queryKey({ operationName: 'Weather', input: { city: 'Berlin' } })
);
