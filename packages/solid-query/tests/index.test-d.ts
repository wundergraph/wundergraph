import { createHooks } from '../src';
import { Client, ClientResponseError, OperationsDefinition, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { CreateQueryResult } from '@tanstack/solid-query';

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

const { createSubscription, createQuery, createMutation, useUser, queryKey } = createHooks<Operations>(
	new Client({
		baseURL: 'http://localhost:8080',
		applicationHash: 'my-application-hash',
		sdkVersion: '0.0.0',
	})
);

const { data: queryData, error: queryError } = createQuery({
	enabled: true,
	operationName: 'Weather',
	input: {
		city: 'Berlin',
	},
});

expectType<Operations['queries']['Weather']['data']>(queryData);
expectType<ClientResponseError | null>(queryError);

const { data: subData, error: subError } = createSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

expectType<Operations['subscriptions']['Weather']['data']>(subData);
expectType<ClientResponseError | null>(subError);

const {
	data: mutData,
	error: mutError,
	mutate,
	mutateAsync,
} = createMutation({
	operationName: 'CreateUser',
});

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

expectType<CreateQueryResult<User<string>, ClientResponseError>>(useUser());
expectType<CreateQueryResult<User<string>, ClientResponseError>>(
	useUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

expectType<('Weather' | { city: string } | undefined)[]>(
	queryKey({ operationName: 'Weather', input: { city: 'Berlin' } })
);
