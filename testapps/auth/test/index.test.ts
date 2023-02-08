import { afterAll, beforeAll, describe, expect, it, test } from '@jest/globals';
import fetch from 'node-fetch';
import * as jose from 'jose';
import { createTestServer } from '../.wundergraph/generated/testing';
import { ClientResponse, ResponseError } from '@wundergraph/sdk/client';

const keyID = '123456';
const keyAlgorithm = 'RS256';

const wg = createTestServer({ fetch: fetch as any });

const tokenIssuer = 'https://example.com';
const defaultTokenSubject = 'admin';
const floatingPointClaim = {
	f: {
		f: {
			f: {
				f: 1.2345,
			},
		},
	},
};

const makeToken = (payload: jose.JWTPayload, privateKey: jose.KeyLike) => {
	return new jose.SignJWT(payload)
		.setProtectedHeader({
			typ: 'JWT',
			alg: keyAlgorithm,
			kid: keyID,
		})
		.setIssuer(tokenIssuer)
		.setSubject(payload.sub || defaultTokenSubject)
		.setAudience('myapp.wundergraph.dev')
		.setExpirationTime('6h')
		.setIssuedAt()
		.sign(privateKey);
};

type Tokens = {
	default: string;
	wellKnownClaims: string;
	withTenantID: string;
	withShopIDInteger: string;
	WithShopIDString: string;
	withFloatingPoint: string;
};

let tokens: Tokens | undefined;

const tenantID = 'my-tenant';
const shopID = 1234556;

const wellKnownClaims = {
	sub: 'lskywalker',
	name: 'Luke Skywalker',
	given_name: 'Luke',
	family_name: 'Skywalker',
	middle_name: '.',
	nickname: 'Little Padawan',
	preferred_username: 'luke',
	profile: 'http://cloud.wundergraph.com/luke',
	picture: 'http://cloud.wundergraph.com/luke.jpg',
	website: 'http://lukeskywalker.com',
	email: 'luke@skywalker.com',
	email_verified: true,
	gender: 'male',
	birthdate: '19 BBY',
	zoneinfo: 'TST',
	locale: 'en_TA',
	location: 'Tatooine',
};

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
		wellKnownClaims: await makeToken(wellKnownClaims, privateKey),
		withTenantID: await makeToken({ teid: tenantID }, privateKey),
		withShopIDInteger: await makeToken({ shop: { id: shopID } }, privateKey),
		WithShopIDString: await makeToken({ shop: { id: `${shopID}` } }, privateKey),
		withFloatingPoint: await makeToken(floatingPointClaim, privateKey),
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

describe('test well known claims (@fromClaim())', () => {
	test('all well known claims have the expected value', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.wellKnownClaims);
		const result = await client.query({
			operationName: 'claims/WellKnown',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();

		const data = result.data!;

		expect(data.issuer).toBe(`string: ${tokenIssuer}`);
		expect(data.subject).toBe(`string: ${wellKnownClaims.sub}`);
		expect(data.userID).toBe(`string: ${wellKnownClaims.sub}`);
		expect(data.name).toBe(`string: ${wellKnownClaims.name}`);
		expect(data.givenName).toBe(`string: ${wellKnownClaims.given_name}`);
		expect(data.familyName).toBe(`string: ${wellKnownClaims.family_name}`);
		expect(data.middleName).toBe(`string: ${wellKnownClaims.middle_name}`);
		expect(data.nickname).toBe(`string: ${wellKnownClaims.nickname}`);
		expect(data.preferredUsername).toBe(`string: ${wellKnownClaims.preferred_username}`);
		expect(data.profile).toBe(`string: ${wellKnownClaims.profile}`);
		expect(data.picture).toBe(`string: ${wellKnownClaims.picture}`);
		expect(data.website).toBe(`string: ${wellKnownClaims.website}`);
		expect(data.email).toBe(`string: ${wellKnownClaims.email}`);
		expect(data.email_verified).toBe(`boolean: ${wellKnownClaims.email_verified}`);
		expect(data.gender).toBe(`string: ${wellKnownClaims.gender}`);
		expect(data.birthDate).toBe(`string: ${wellKnownClaims.birthdate}`);
		expect(data.zoneInfo).toBe(`string: ${wellKnownClaims.zoneinfo}`);
		expect(data.locale).toBe(`string: ${wellKnownClaims.locale}`);
		expect(data.location).toBe(`string: ${wellKnownClaims.location}`);
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

	test('token missing required custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.default);
		const result = await client.query({
			operationName: 'claims/TenantID',
		});
		expect(result.data).toBeUndefined();
		expect(result.error).toBeDefined();
		expect(result.error?.message).toBe('required customClaim tenantID not found');
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

	test('token with floating point custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withFloatingPoint);
		const result = await client.query({
			operationName: 'claims/FloatingPointValue',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_float).toBe(`float: ${floatingPointClaim.f.f.f.f}`);
	});
});
