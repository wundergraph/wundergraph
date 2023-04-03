import { urlIsLocalNetwork } from '.';

describe('urlIsLocalNetwork', () => {
	const testCases: { url: string; expect: boolean }[] = [
		{ url: 'http://wundergraph.com', expect: false },
		{ url: 'http://localhost', expect: true },
		{ url: 'http://localhost:8080', expect: true },
		{ url: 'http://192.168.123.123', expect: true },
		{ url: 'http://1.2.3.4', expect: false },
	];
	for (const t of testCases) {
		test(`urlIsLocalNetwork(${t.url}) = ${t.expect}`, async () => {
			expect(await urlIsLocalNetwork(t.url)).toBe(t.expect);
		});
	}
});
