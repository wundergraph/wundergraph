import { toJson } from './tojson';

describe('toJson', () => {
	it('should encode data correctly', async () => {
		expect(await toJson([])).toBe('[]');
		expect(await toJson([1, '2', '03'])).toBe('[1,"2","03"]');
		expect(await toJson(null)).toBe('null');
		expect(await toJson('key')).toBe('"key"');
		expect(await toJson({ a: 1 })).toBe('{"a":1}');
	});
});
