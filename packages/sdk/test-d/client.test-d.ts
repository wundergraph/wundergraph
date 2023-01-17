import { expectType } from 'tsd';
import {
	Client,
	ClientResponse,
	SubscriptionRequestOptions,
	MutationRequestOptions,
	QueryRequestOptions,
	User,
} from '../src/client';

const client = new Client({
	baseURL: 'https://api.com',
	applicationHash: '123',
	customFetch: fetch as any,
	sdkVersion: '1.0.0',
});

// Queries

expectType<Promise<ClientResponse<{ id: string }>>>(
	client.query<QueryRequestOptions<'Weather', { lat: number }>, { id: string }>({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

expectType<Promise<ClientResponse<any>>>(
	client.query({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

// Mutation

expectType<Promise<ClientResponse<{ id: string }>>>(
	client.mutate<MutationRequestOptions<'Weather', { lat: number }>, { id: string }>({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

expectType<Promise<ClientResponse<any>>>(
	client.mutate({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);

// Subscription

expectType<Promise<void | ClientResponse<{ id: string }>>>(
	client.subscribe<SubscriptionRequestOptions<'Weather', { lat: number }>, { id: string }>(
		{
			operationName: 'Weather',
			input: { lat: 1 },
		},
		(resp) => {
			expectType<{ id: string } | undefined>(resp.data);
		}
	)
);

expectType<Promise<void | ClientResponse<unknown>>>(
	client.subscribe(
		{
			operationName: 'Weather',
			input: { lat: 1 },
		},
		(resp) => {
			expectType<unknown>(resp.data);
		}
	)
);

// Get user

expectType<Promise<User>>(client.fetchUser());

expectType<Promise<User<string>>>(client.fetchUser<User<string>>());

expectType<Promise<User<string>>>(
	client.fetchUser<User<string>>({
		revalidate: true,
		abortSignal: new AbortController().signal,
	})
);

// Login

expectType<void>(client.login('providerId'));
expectType<void>(client.login('providerId', 'redirectUrl'));
expectType<Promise<boolean>>(
	client.logout({
		logoutOpenidConnectProvider: true,
	})
);

// Logout

expectType<Promise<boolean>>(client.logout());
expectType<Promise<boolean>>(
	client.logout({
		logoutOpenidConnectProvider: true,
	})
);

// Set extra headers

expectType<void>(client.setExtraHeaders({ 'x-foo': 'bar' }));

// Build cache key

expectType<string>(
	Client.buildCacheKey({
		operationName: 'Weather',
		input: { lat: 1 },
	})
);
