import * as fs from 'fs';
import GrpcSchemaBuilder from './builder';
import { printSchema } from 'graphql';

const runTest = async (testFile: string, snapShot: string) => {
	const exists = fs.existsSync(testFile);
	if (!exists) {
		return;
	}
	const fileContents = fs.readFileSync(testFile);

	const gprc = new GrpcSchemaBuilder(fileContents, '');
	const Schema = await gprc.Schema();

	const printedSchema = printSchema(Schema);
	expect(printedSchema).toMatchSnapshot(snapShot + '_' + 'schema');

	// fs.writeFileSync('src/grpc/' + snapShot + '.grapqhl', printedSchema);
};

test('starwars grpc', async () => {
	await runTest('../../pkg/datasources/grpc/testdata/starwars/starwars.protoset', 'starwars_grpc');
});
