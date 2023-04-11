import nock from 'nock';

export const nockQuery = (operationName = 'Weather', wgParams = {}) => {
	return nock('https://api.com')
		.matchHeader('accept', 'application/json')
		.matchHeader('content-type', 'application/json')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.get('/relay/operations/' + operationName)
		.query({ wg_api_hash: '123', wg_variables: '{}', ...wgParams });
};

export const nockMutation = (operationName = 'SetName', wgParams = {}, authenticated = false) => {
	const csrfScope = nock('https://api.com')
		.matchHeader('accept', 'text/plain')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.get('/auth/cookie/csrf')
		.reply(200, 'csrf');
	const mutation = nock('https://api.com')
		.matchHeader('accept', 'application/json')
		.matchHeader('content-type', 'application/json')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.post('/operations/' + operationName, wgParams)
		.query({ wg_api_hash: '123' });

	if (authenticated) {
		mutation.matchHeader('x-csrf-token', 'csrf');
	}

	return {
		csrfScope,
		mutation,
	};
};
