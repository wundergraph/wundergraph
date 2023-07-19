import { z } from 'zod';
import { introspectNatsKV } from './nats-kv-introspection';

describe('nats kv', () => {
	describe('introspection', function () {
		it('should work for simple models', async function () {
			const introspection = await introspectNatsKV({
				apiNamespace: 'token',
				model: z.object({
					token: z.string(),
				}),
			});
			const out = await introspection({});
			expect(out.Schema).toMatchSnapshot();
			out.Schema = '';
			expect(JSON.stringify(out, null, '  ')).toMatchSnapshot();
		});
		it('should work for nested models', async function () {
			const introspection = await introspectNatsKV({
				apiNamespace: 'token',
				model: z.object({
					token: z.string(),
					user: z.object({
						id: z.number(),
					}),
					org: z.object({
						id: z.number(),
					}),
				}),
			});
			const out = await introspection({});
			expect(out.Schema).toMatchSnapshot();
			out.Schema = '';
			expect(JSON.stringify(out, null, '  ')).toMatchSnapshot();
		});
	});
});
