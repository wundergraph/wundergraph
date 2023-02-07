import { afterAll, beforeAll, describe, expect, it, test } from '@jest/globals';
import fetch from 'node-fetch';
import * as jose from 'jose';
import { createTestServer } from '../.wundergraph/generated/testing';
import { ClientResponse, ResponseError } from '@wundergraph/sdk/client';

const keyID = '123456';
const keyAlgorithm = 'RS256';

const wg = createTestServer({ fetch: fetch as any });

const makeToken = (payload: jose.JWTPayload, privateKey: jose.KeyLike) => {
	return new jose.SignJWT(payload)
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
};

type Tokens = {
	default: string;
	withTenantID: string;
	withShopIDInteger: string;
	WithShopIDString: string;
};

let tokens: Tokens | undefined;

const tenantID = 'my-tenant';
const shopID = 1234556;

const startServer = async () => {
	const { publicKey, privateKey } = await jose.generateKeyPair(keyAlgorithm);
	const publicKeyJWK = await jose.exportJWK(publicKey);

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
	tokens = {
		default: await makeToken({}, privateKey),
		withTenantID: await makeToken({ teid: tenantID }, privateKey),
		withShopIDInteger: await makeToken({ shop: { id: shopID } }, privateKey),
		WithShopIDString: await makeToken({ shop: { id: `${shopID}` } }, privateKey),
	};
	return wg.start();
};

beforeAll(() => startServer());
afterAll(() => wg.stop());

const expectUnauthorized = <T>(result: ClientResponse<T>) => {
	expect(result.data).toBeUndefined();
	expect(result.error).toBeDefined();
	expect((result.error as ResponseError).statusCode).toBe(401);
};

describe('test token Authorization', () => {
	test('valid token', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.default);
		const result = await client.query({
			operationName: 'echo/String',
			input: {
				input: 'hello',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_string).toBe('string: hello');
	});

	test('no header', async () => {
		const result = await wg.client().query({
			operationName: 'echo/String',
			input: {
				input: 'bad',
			},
		});
		expectUnauthorized(result);
	});

	test('invalid token', async () => {
		const client = wg.client();
		client.setAuthorizationToken('random');
		const result = await client.query({
			operationName: 'echo/String',
			input: {
				input: 'bad',
			},
		});
		expectUnauthorized(result);
	});

	test('empty token', async () => {
		const client = wg.client();
		client.setAuthorizationToken('');
		const result = await client.query({
			operationName: 'echo/String',
			input: {
				input: 'bad',
			},
		});
		expectUnauthorized(result);
	});
});

describe('test @fromCustomClaim', () => {
	test('token with string custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withTenantID);
		const result = await client.query({
			operationName: 'claims/TenantID',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_string).toBe(`string: ${tenantID}`);
	});

	test('token with nested integer custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withShopIDInteger);
		const result = await client.query({
			operationName: 'claims/ShopID',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_int).toBe(`int: ${shopID}`);
	});

	test('token with invalid type custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.WithShopIDString);
		const result = await client.query({
			operationName: 'claims/ShopID',
		});
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toBe('customClaim shopID expected to be of type INT, found string instead');
	});

	test('token with custom claim not required', async () => {
		const defaultShopID = 99; // From ShopID.graphql
		const client = wg.client();
		client.setAuthorizationToken(tokens!.default);
		const result = await client.query({
			operationName: 'claims/ShopID',
		});
		// Should fail because shopID is null, not because the claim is
		// missing
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toBe('Variable "$input" of non-null type "Int!" must not be null.');
	});
});
