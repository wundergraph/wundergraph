import { createHooks } from '../src';
import { Client, ResponseError, OperationsDefinition, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { CreateQueryResult } from '@tanstack/solid-query';

interface Operations extends OperationsDefinition {
	queries: {
		Weather: {
			input: {
				city: string;
			};
			response: { data?: { temperature: number }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
	subscriptions: {
		Weather: {
			input: {
				forCity: string;
			};
			response: { data?: { temperature: number }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
	mutations: {
		CreateUser: {
			input: {
				name: string;
			};
			response: { data?: { name: string }; error?: ResponseError };
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

expectType<Operations['queries']['Weather']['response']['data']>(queryData);
expectType<ResponseError | undefined | null>(queryError);

const { data: subData, error: subError } = createSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

expectType<Operations['subscriptions']['Weather']['response']['data']>(subData);
expectType<ResponseError | undefined | null>(subError);

const {
	data: mutData,
	error: mutError,
	mutate,
	mutateAsync,
} = createMutation({
	operationName: 'CreateUser',
});

expectType<Operations['mutations']['CreateUser']['response']['data']>(mutData);
expectType<ResponseError | undefined | null>(mutError);

expectType<void>(
	mutate({
		name: 'John Doe',
	})
);

expectType<Promise<Operations['mutations']['CreateUser']['response']['data']>>(
	mutateAsync({
		name: 'John Doe',
	})
);

expectType<CreateQueryResult<User<string>, ResponseError>>(useUser());
expectType<CreateQueryResult<User<string>, ResponseError>>(
	useUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

expectType<('Weather' | { city: string } | undefined)[]>(
	queryKey({ operationName: 'Weather', input: { city: 'Berlin' } })
);
