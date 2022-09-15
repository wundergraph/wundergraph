import { serialize } from './serialize';
import { stableHash } from './hash';

describe('serialize', () => {
	it('should serialize arguments correctly', async () => {
		expect(serialize([])).toBe('');
		expect(serialize(null)).toBe('');
		expect(serialize('key')).toBe('key');

		expect(serialize({ a: 1 })).toBe('#a:1,');
		expect(serialize({ a: 1 })).toBe(stableHash({ a: 1 }));

		expect(serialize({ a: 1, b: { c: null } })).toBe('#b:#c:null,,a:1,');
		expect(serialize({ a: 1, b: { c: null } })).toBe(stableHash({ a: 1, b: { c: null } }));

		expect(serialize({ a: 1, b: { c: null, d: [1] } })).toBe('#b:#d:@1,,c:null,,a:1,');
		expect(serialize({ a: 1, b: { c: null, d: [1] } })).toBe(stableHash({ a: 1, b: { c: null, d: [1] } }));

		expect(serialize([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])).toBe(
			stableHash([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])
		);
	});
});
