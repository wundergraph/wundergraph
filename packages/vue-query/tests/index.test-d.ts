import { createHooks } from '../src';
import { Client, ResponseError, OperationsDefinition, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { UseQueryReturnType } from '@tanstack/vue-query';
import { unref } from 'vue';

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

const { useSubscription, useQuery, useMutation, useUser, queryKey } = createHooks<Operations>(
	new Client({
		baseURL: 'http://localhost:8080',
		applicationHash: 'my-application-hash',
		sdkVersion: '0.0.0',
	})
);

const { data: queryData, error: queryError } = useQuery({
	enabled: true,
	operationName: 'Weather',
	input: {
		city: 'Berlin',
	},
});

expectType<Operations['queries']['Weather']['response']['data']>(unref(queryData));
expectType<ResponseError | null | undefined>(unref(queryError));

const { data: subData, error: subError } = useSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

expectType<Operations['subscriptions']['Weather']['response']['data']>(unref(subData));
expectType<ResponseError | null | undefined>(unref(subError));

const {
	data: mutData,
	error: mutError,
	mutate,
	mutateAsync,
} = useMutation({
	operationName: 'CreateUser',
});

expectType<Operations['mutations']['CreateUser']['response']['data']>(unref(mutData));
expectType<ResponseError | null | undefined>(unref(mutError));

expectType<void>(
	mutate({
		name: 'John Doe',
	})
);

expectType<Promise<{ name: string } | undefined>>(
	mutateAsync({
		name: 'John Doe',
	})
);

expectType<UseQueryReturnType<User<string>, ResponseError>>(useUser());
expectType<UseQueryReturnType<User<string>, ResponseError>>(
	useUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

expectType<('Weather' | { city: string } | undefined)[]>(
	queryKey({ operationName: 'Weather', input: { city: 'Berlin' } })
);
