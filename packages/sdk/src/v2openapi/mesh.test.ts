import { describe } from 'node:test';
import { interpolationToTemplate } from './mesh';

describe('interpolationToTemplate', () => {
	it('should convert interpolation to template', () => {
		expect(interpolationToTemplate(`"$$cookie={args._DOLLAR__DOLLAR_cookie};\\"`)).toEqual(
			`"$$cookie={{ .arguments._DOLLAR__DOLLAR_cookie }};\\"`
		);

		expect(interpolationToTemplate(`{args.cookie}`)).toEqual(`{{ .arguments.cookie }}`);
	});
});
