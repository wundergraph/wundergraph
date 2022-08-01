import { protosetToGrpcApiObject } from './index';
import * as fs from 'fs';

const runTest = async (testFile: string, snapShot: string, apiNamespace?: string) => {
	const exists = fs.existsSync(testFile);
	if (!exists) {
		return;
	}
	const fileContents = fs.readFileSync(testFile);

	const actual = await protosetToGrpcApiObject(fileContents, '', apiNamespace);

	expect(actual.Schema).toMatchSnapshot(snapShot + '_' + 'schema');
	expect(JSON.stringify(actual.DataSources, null, 2)).toMatchSnapshot(snapShot + '_' + 'data_sources');
	expect(JSON.stringify(actual.Fields, null, 2)).toMatchSnapshot(snapShot + '_' + 'fields');

	// const content = JSON.stringify(actual, null, ' ')
	// fs.writeFileSync('src/grpc/'+snapShot + '.json', content);
};

test('starwars grpc', async () => {
	await runTest('../../pkg/datasources/grpc/testdata/starwars/starwars.protoset', 'starwars_grpc');
});

test('starwars grpc namespaced', async () => {
	await runTest('../../pkg/datasources/grpc/testdata/starwars/starwars.protoset', 'starwars_grpc_namespaced', 'gprc');
});
