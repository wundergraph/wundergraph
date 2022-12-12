import { handlebarTemplate } from './testing.template';
import Handlebars from 'handlebars';
import { Template, TemplateOutputFile } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import { formatTypeScript } from '.';
import templates from '../index';

export class TypeScriptTesting implements Template {
	constructor() {}
	generate(_: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);
		const content = tmpl({});
		return Promise.resolve([
			{
				path: 'testing.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
	dependencies(): Template[] {
		return [templates.typescript.client];
	}
}
