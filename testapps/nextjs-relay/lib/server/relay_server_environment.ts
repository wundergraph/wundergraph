import { Environment, Network, RecordSource, Store } from 'relay-runtime';

export function createServerNetwork() {
	return Network.create(async (params, variables) => {
		console.log(`createServerNetwork-params: ${JSON.stringify({ params, variables })}`);
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
		console.log(
			`createServerNetwork-response: ${JSON.stringify({ response: response.status, headers: response.headers })}`
		);
		return await response.json();
	});
}

export function createServerEnvironment() {
	return new Environment({
		network: createServerNetwork(),
		store: new Store(new RecordSource()),
		isServer: true,
	});
}
