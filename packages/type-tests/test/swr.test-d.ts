import { createHooks } from '@wundergraph/swr';
import { Client, OperationsDefinition, GraphQLResponseError, User } from '@wundergraph/sdk/client';
import { expectType } from 'tsd';
import { SWRResponse } from 'swr';

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

const { useSubscription, useQuery, useMutation, useUser } = createHooks<Operations>(
	new Client({
		baseURL: 'http://localhost:8080',
		applicationHash: 'my-application-hash',
		applicationPath: 'app',
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

expectType<Operations['queries']['Weather']['data']>(queryData);
expectType<GraphQLResponseError | undefined>(queryError);

const { data: subData, error: subError } = useSubscription({
	enabled: true,
	subscribeOnce: true,
	operationName: 'Weather',
	input: {
		forCity: 'Berlin',
	},
});

expectType<Operations['subscriptions']['Weather']['data']>(subData);
expectType<GraphQLResponseError | undefined>(subError);

const {
	data: mutData,
	error: mutError,
	mutate,
} = useMutation({
	operationName: 'CreateUser',
});

expectType<Operations['mutations']['CreateUser']['data']>(mutData);
expectType<GraphQLResponseError | undefined>(mutError);

expectType<SWRResponse<User>>(useUser());
expectType<SWRResponse<User>>(
	useUser({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);
