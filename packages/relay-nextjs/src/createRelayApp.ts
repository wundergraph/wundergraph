import type { Client } from '@wundergraph/sdk/client';
import { hydrateRelayEnvironment } from 'relay-nextjs';
import { Environment, Network, RecordSource, Store } from 'relay-runtime';

let clientEnv: Environment | undefined;

export const createRelayApp = (client: Client) => {
	const createServerNetwork = () => {
		return Network.create(async (params, variables) => {
			const { id, operationKind } = params;
			const response =
				operationKind === 'query'
					? await client.query({
							operationName: `relay/${id}`,
							input: variables,
					  })
					: await client.mutate({
							operationName: `relay/${id}`,
							input: variables,
					  });
			// TODO: figure out a better way to return errors for relay
			return {
				...response,
				errors: response.error ? [response.error] : [],
			};
		});
	};

	const createServerEnvironment = () => {
		return new Environment({
			network: createServerNetwork(),
			store: new Store(new RecordSource()),
			isServer: true,
		});
	};

	const createClientNetwork = () => {
		return Network.create(async (params, variables) => {
			const { id, operationKind } = params;
			const response =
				operationKind === 'query'
					? await client.query({
							operationName: `relay/${id}`,
							input: variables,
					  })
					: await client.mutate({
							operationName: `relay/${id}`,
							input: variables,
					  });
			// TODO: figure out a better way to return errors for relay
			return {
				...response,
				errors: response.error ? [response.error] : [],
			};
		});
	};

	const createClientEnvironment = () => {
		if (typeof window === 'undefined') return null;

		if (clientEnv == null) {
			clientEnv = new Environment({
				network: createClientNetwork(),
				store: new Store(new RecordSource()),
				isServer: false,
			});

			hydrateRelayEnvironment(clientEnv);
		}

		return clientEnv;
	};

	return {
		createClientEnvironment,
		createClientNetwork,
		createServerEnvironment,
		createServerNetwork,
	};
};
