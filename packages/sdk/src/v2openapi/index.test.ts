import { openApiSpecificationToRESTApiObject } from './index';
import * as fs from 'fs';

const runTest = async (testFile: string, snapShot: string, statusCodeUnions?: boolean) => {
	const exists = fs.existsSync(testFile);
	if (!exists) {
		return;
	}
	const fileContents = fs.readFileSync(testFile).toString();
	const actual = await openApiSpecificationToRESTApiObject(fileContents, {
		apiNamespace: 'api',
		authentication: undefined,
		headers: undefined,
		source: {
			kind: 'string',
			openAPISpec: fileContents,
		},
		statusCodeUnions,
	});
	expect(actual.Schema).toMatchSnapshot(snapShot + '_' + 'schema');
	expect(JSON.stringify(actual.DataSources, null, 2)).toMatchSnapshot(snapShot + '_' + 'data_sources');
	expect(JSON.stringify(actual.Fields, null, 2)).toMatchSnapshot(snapShot + '_' + 'fields');
};

test('complex oas3', async () => {
	await runTest('src/v2openapi/testdata/complex_oas3.json', 'complex_oas3');
});

test('complex2 oas3', async () => {
	await runTest('src/v2openapi/testdata/complex_2.json', 'complex2_oas3');
});

test('httpbin', async () => {
	await runTest('src/v2openapi/testdata/httpbin.json', 'httpbin');
});

test('simple petstore', async () => {
	await runTest('src/v2openapi/testdata/simple_petstore.json', 'petstore');
});

test('users', async () => {
	await runTest('src/v2openapi/testdata/users.json', 'users');
});

test('json placeholder', async () => {
	await runTest('src/v2openapi/testdata/jsonplaceholder.v1.yaml', 'json_placeholder');
});

test('fusion', async () => {
	await runTest('src/v2openapi/testdata/fusion.yaml', 'fusion');
});

test('fusion with statusCodeUnions', async () => {
	await runTest('src/v2openapi/testdata/fusion.yaml', 'fusion', true);
});

test('fusion v2 with statusCodeUnions', async () => {
	await runTest('src/v2openapi/testdata/fusionauth_v2.yml', 'fusion_v2', true);
});

test('weather', async () => {
	await runTest('src/v2openapi/testdata/weather.yaml', 'weather');
});

test('with_path_parameters', async () => {
	await runTest('src/v2openapi/testdata/with_path_parameters.yaml', 'fusion');
});

test('with url encoded params', async () => {
	await runTest('src/v2openapi/testdata/stripe_query.yaml', 'stripe_query');
});

test('petstore', async () => {
	await runTest('src/v2openapi/testdata/petstore.yaml', 'petstore');
});

test('json placeholder array', async () => {
	await runTest('src/v2openapi/testdata/json_placeholder.json', 'jsp_array');
});

test('github starred with unions', async () => {
	await runTest('src/v2openapi/testdata/github.json', 'github_starred', true);
});

test('dynamic baseurl', async () => {
	await runTest('src/v2openapi/testdata/dynamic_baseurl.json', 'dynamic_baseurl');
});

test('subscription as object field', async () => {
	await runTest('src/v2openapi/testdata/oas_with_subscription.yaml', 'subscription_as_object_field');
});

test('non alphanumeric fields', async () => {
	await runTest('src/v2openapi/testdata/non_alphanumeric_fields.yaml', 'non_alphanumeric_fields');
});
