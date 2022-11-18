import { Headers, Response } from './http';

describe('testing Headers', () => {
	test('get/set/append', () => {
		const hdr = new Headers();
		hdr.append('foo', 'bar');
		hdr.append('foo', 'baz');

		expect(hdr.get('foo')).toBe('bar,baz');

		hdr.set('foo', 'something');
		expect(hdr.get('foo')).toBe('something');

		hdr.delete('foo');
		expect(hdr.get('foo')).toBe(null);
	});

	test('init', () => {
		const hdr1 = new Headers({ foo: 'bar' });
		expect(hdr1.get('foo')).toBe('bar');

		const hdr2 = new Headers(hdr1);
		expect(hdr2.get('foo')).toBe('bar');

		const hdr3 = new Headers([
			['foo', 'bar'],
			['foo', 'baz'],
		]);
		expect(hdr3.get('foo')).toBe('bar,baz');
	});

	test('iterate', () => {
		const hdr = new Headers([
			['a', '1'],
			['b', '2'],
		]);
		let values: Record<string, string> = {};
		for (const [k, v] of hdr) {
			values[k] = v;
		}
		expect(Object.keys(values).length).toBe(2);
		expect(values['a']).toBe('1');
		expect(values['b']).toBe('2');
	});
});

describe('testing Response', () => {
	test('init', async () => {
		const r1 = new Response('');
		expect(r1.status).toBe(200);
		expect(await r1.text()).toBe('');

		const b2 = 'Not Found';
		const r2 = new Response(b2, { status: 404 });
		expect(r2.status).toBe(404);
		expect(await r2.text()).toBe(b2);

		const r3 = new Response('', { headers: { foo: 'bar' } });
		expect(r3.headers.get('foo')).toBe('bar');

		const r4 = new Response('', { headers: new Headers({ foo: 'bar' }) });
		expect(r4.headers.get('foo')).toBe('bar');
	});
});
