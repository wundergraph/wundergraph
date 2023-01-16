import { describe, test, expect } from '@jest/globals';
import { NewClient } from '../client/client';
import { KeyValueEntry } from '../gen/bifrost/bifrost_pb';
import { ConnectError, Code } from '@bufbuild/connect-web';

describe('Test bifrost client', () => {
	test('kv', async () => {
		const client = NewClient();

		const putRes = await client.put({
			key: 'top-products',
			value: JSON.stringify({ upc: 'table' }),
		});
		expect(putRes.revision).toEqual(BigInt(1));

		const getRes = await client.get({
			key: 'top-products',
		});

		expect(getRes.keyValueEntry).toEqual(
			new KeyValueEntry({
				key: 'top-products',
				value: JSON.stringify({ upc: 'table' }),
				revision: BigInt(1),
			})
		);

		const delRes = await client.delete({
			key: 'top-products',
		});

		try {
			const getRes = await client.get({
				key: 'top-products',
			});
		} catch (err) {
			console.log(typeof err);
			if (err instanceof ConnectError) {
				console.log(err.code);
				console.log(err.message);
				console.log(err.rawMessage);

				expect(err.code).toEqual(Code.NotFound);
				expect(err.rawMessage).toEqual('key not found');
			}
		}
	});
});
