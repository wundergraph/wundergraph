import { hydrateRelayEnvironment } from 'relay-nextjs';
import { Environment, Network, Store, RecordSource } from 'relay-runtime';

export const createClientNetwork = () => {
	return Network.create(async (params, variables) => {
		console.log(`createClientNetwork-params: ${JSON.stringify({ params, variables })}`);
		const { id, operationKind } = params;
		const body = operationKind === 'mutation' ? JSON.stringify(variables) : undefined;
		const urlQuery =
			operationKind === 'query' ? `?${new URLSearchParams({ wg_variables: JSON.stringify(variables) })}` : '';
		const response = await fetch('http://localhost:9991/operations/relay/' + id + urlQuery, {
			method: operationKind === 'mutation' ? 'POST' : 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			body,
		});
		return await response.json();
	});
};

let clientEnv: Environment | undefined;
export const createClientEnvironment = () => {
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
