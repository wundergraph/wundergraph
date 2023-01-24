import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import * as jose from 'jose';
import { createTestServer } from '../.wundergraph/generated/testing';
import { ClientResponse, ResponseError } from '@wundergraph/sdk/client';
import { HelloResponseData } from '../.wundergraph/generated/models';

const wg = createTestServer({ fetch: fetch as any });

let authorizationToken = '';

const startServer = async () => {
	const keyID = '123456';
	const keyAlgorithm = 'RS256';
	const { publicKey, privateKey } = await jose.generateKeyPair(keyAlgorithm);
	const publicKeyJWK = await jose.exportJWK(publicKey);
	const token = await new jose.SignJWT({})
		.setProtectedHeader({
			typ: 'JWT',
			alg: keyAlgorithm,
			kid: keyID,
		})
		.setIssuer('https://example.com')
		.setSubject('admin')
		.setAudience('myapp.wundergraph.dev')
		.setExpirationTime('6h')
		.setIssuedAt()
		.sign(privateKey);

	const jwksKeys = {
		keys: [
			{
				use: 'sig',
				kid: keyID,
				alg: keyAlgorithm,
				kty: 'RSA',
				n: publicKeyJWK.n!,
				e: publicKeyJWK.e!,
			},
		],
	};

	process.env['JWKS_JSON'] = JSON.stringify(jwksKeys);
	authorizationToken = token;
	return wg.start();
};

beforeAll(() => startServer());
afterAll(() => wg.stop());

const expectUnauthorized = (result: ClientResponse<HelloResponseData>) => {
	expect(result.data).toBeUndefined();
	expect(result.error).toBeDefined();
	expect((result.error as ResponseError).statusCode).toBe(401);
};

describe('test token Authorization', () => {
	test('valid token', async () => {
		const client = wg.client();
		client.setAuthorizationToken(authorizationToken);
		const result = await client.query({
			operationName: 'Hello',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.gql_hello).toBe('world');
	});

	test('no header', async () => {
		const result = await wg.client().query({
			operationName: 'Hello',
		});
		expectUnauthorized(result);
	});

	test('invalid token', async () => {
		const client = wg.client();
		client.setAuthorizationToken('random');
		const result = await client.query({
			operationName: 'Hello',
		});
		expectUnauthorized(result);
	});

	test('empty token', async () => {
		const client = wg.client();
		client.setAuthorizationToken('');
		const result = await client.query({
			operationName: 'Hello',
		});
		expectUnauthorized(result);
	});
});
