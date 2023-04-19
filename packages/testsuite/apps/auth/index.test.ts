import { beforeAll, describe, expect, it } from 'vitest';
import * as jose from 'jose';
import { ClientResponse, ResponseError } from '@wundergraph/sdk/client';

const keyID = '123456';
const keyAlgorithm = 'RS256';

import { createTestServer } from './.wundergraph/generated/testing';

const wg = createTestServer({
	dir: __dirname,
});

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
	withCountry: string;
	withCountryAndMatchingCurrency: string;
	withCountryAndWrongCurrency: string;
	withNotAllowedByPostAuthenticationSub: string;
	withNotAllowedByRevalidationSub: string;
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

const expectUnauthorized = <T>(result: ClientResponse<T>) => {
	expect(result.data).toBeUndefined();
	expect(result.error).toBeDefined();
	expect((result.error as ResponseError).statusCode).toBe(401);
};

beforeAll(async () => {
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
		withCountry: await makeToken({ cc: 'PT' }, privateKey),
		withCountryAndMatchingCurrency: await makeToken({ cc: 'PT', currency: 'EUR' }, privateKey),
		withCountryAndWrongCurrency: await makeToken({ cc: 'PT', currency: 'USD' }, privateKey),
		withNotAllowedByPostAuthenticationSub: await makeToken({ sub: 'notAllowedByPostAuthentication' }, privateKey),
		withNotAllowedByRevalidationSub: await makeToken({ sub: 'notAllowedByRevalidation' }, privateKey),
	};

	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('test token Authorization', () => {
	it('valid token', async () => {
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

	it('no header', async () => {
		const result = await wg.client().query({
			operationName: 'echo/String',
			input: {
				input: 'bad',
			},
		});
		expectUnauthorized(result);
	});

	it('invalid token', async () => {
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

	it('empty token', async () => {
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
	it('all well known claims have the expected value', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.wellKnownClaims);
		const result = await client.query({
			operationName: 'claims/WellKnown',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();

		const data = result.data!;

		expect(data.issuer).toBe(`string: ${tokenIssuer}`);
		expect(data.provider).toBe(`string: ${tokenIssuer}`);
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

	it('all well known claims have the expected value in User', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.wellKnownClaims);
		const result = await client.query({
			operationName: 'claims/User',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();

		const data = result.data!;

		expect(data.providerId).toBe(tokenIssuer);
		expect(data.userId).toBe(wellKnownClaims.sub);
		expect(data.name).toBe(wellKnownClaims.name);
		expect(data.firstName).toBe(wellKnownClaims.given_name);
		expect(data.lastName).toBe(wellKnownClaims.family_name);
		expect(data.middleName).toBe(wellKnownClaims.middle_name);
		expect(data.nickName).toBe(wellKnownClaims.nickname);
		expect(data.preferredUsername).toBe(wellKnownClaims.preferred_username);
		expect(data.profile).toBe(wellKnownClaims.profile);
		expect(data.picture).toBe(wellKnownClaims.picture);
		expect(data.website).toBe(wellKnownClaims.website);
		expect(data.email).toBe(wellKnownClaims.email);
		expect(data.emailVerified).toBe(wellKnownClaims.email_verified);
		expect(data.gender).toBe(wellKnownClaims.gender);
		expect(data.birthDate).toBe(wellKnownClaims.birthdate);
		expect(data.zoneInfo).toBe(wellKnownClaims.zoneinfo);
		expect(data.locale).toBe(wellKnownClaims.locale);
		expect(data.location).toBe(wellKnownClaims.location);
	});
});

describe('test @fromClaim with custom claims', () => {
	it('token with string custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withTenantID);
		const result = await client.query({
			operationName: 'claims/TenantID',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_string).toBe(`string: ${tenantID}`);
	});

	it('token missing required custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.default);
		const result = await client.query({
			operationName: 'claims/TenantID',
		});
		expect(result.data).toBeUndefined();
		expect(result.error).toBeDefined();
		expect(result.error?.message).toBe('required customClaim tenantID not found');
	});

	it('token with nested integer custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withShopIDInteger);
		const result = await client.query({
			operationName: 'claims/ShopID',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_int).toBe(`int: ${shopID}`);
	});

	it('token with invalid type custom claim', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.WithShopIDString);
		const result = await client.query({
			operationName: 'claims/ShopID',
		});
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toBe('customClaim shopID expected to be of type INT, found string instead');
	});

	it('token with custom claim not required', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.default);
		const result = await client.query({
			operationName: 'claims/ShopID',
		});
		// Should fail because shopID is null, not because the claim is
		// missing
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toBe('Variable "$input" of required type "Int!" was not provided.');
	});

	it('token with floating point custom claim', async () => {
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

describe('test @fromClaim with nested injection', () => {
	it('inject country code', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withCountry);
		const result = await client.query({
			operationName: 'claims/NestedInjectedClaim',
		});

		const countries = result.data!.countries_countries;
		expect(countries.length).toBe(1);
		expect(countries[0].capital).toBe('Lisbon');
	});

	it('inject country code with currency', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withCountryAndMatchingCurrency);
		const result = await client.query({
			operationName: 'claims/NestedInjectedClaims',
		});

		const countries = result.data!.countries_countries;
		expect(countries.length).toBe(1);
		expect(countries[0].capital).toBe('Lisbon');
	});

	it('inject country code with wrong currency', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withCountryAndWrongCurrency);
		const result = await client.query({
			operationName: 'claims/NestedInjectedClaims',
		});

		// There should be no results if both claims are injected
		expect(result.data!.countries_countries.length).toBe(0);
	});

	it('inject one argument', async () => {
		const data = 'foo';
		const client = wg.client();
		client.setAuthorizationToken(tokens!.wellKnownClaims);
		const result = await client.query({
			operationName: 'claims/UserID',
			input: {
				data,
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.uid).toBe(`string: ${wellKnownClaims.sub}`);
		expect(result.data?.data).toBe(`string: ${data}`);
	});

	it('inject into struct', async () => {
		const b = 'b';
		const c = 'c';
		const client = wg.client();
		client.setAuthorizationToken(tokens!.wellKnownClaims);
		const result = await client.query({
			operationName: 'claims/IntoStruct',
			input: {
				// 'a' comes from a claim, should be removed from input schema
				struct: {
					b,
					c,
				},
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.echo_struct).toBe(`struct: a:${wellKnownClaims.sub} b:${b} c:${c}`);
	});
});

describe('public claims', () => {
	it('only public claims should be published', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.WithShopIDString);
		const user = await client.fetchUser();
		expect(user.userId).toBe(defaultTokenSubject);
		expect((user as any)['providerId']).toBeUndefined();
	});
});

// TODO: Check error messages once we implement them instead of returning 404
describe('user endpoints', () => {
	it('fetchUser() with authentication and revalidation', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.WithShopIDString);
		const user = await client.fetchUser();

		expect(user.userId).toBe('admin');
		// Set by hooks
		expect(user.firstName).toBe('mutatingPostAuthentication');
		expect(user.lastName).toBeUndefined();

		const revalidated = await client.fetchUser({ revalidate: true });

		expect(revalidated.userId).toBe('admin');
		// Set by hooks
		expect(revalidated.firstName).toBe('mutatingPostAuthentication');
		expect(revalidated.lastName).toBe('revalidate');
	});

	it('fetchUser() not allowed in postAuthentication', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withNotAllowedByPostAuthenticationSub);
		await expect(async () => client.fetchUser()).rejects.toThrow();
	});

	it('fetchUser() not allowed in revalidation', async () => {
		const client = wg.client();
		client.setAuthorizationToken(tokens!.withNotAllowedByRevalidationSub);
		await expect(async () => client.fetchUser({ revalidate: true })).rejects.toThrow();

		// If we don't revalidate, we should be allowed to authenticate
		const user = await client.fetchUser();
		expect(user.userId).toBe('notAllowedByRevalidation');
	});

	it('fetchUser() without authentication', async () => {
		const client = wg.client();
		await expect(async () => client.fetchUser()).rejects.toThrow();
		await expect(async () => client.fetchUser({ revalidate: true })).rejects.toThrow();
	});
});
