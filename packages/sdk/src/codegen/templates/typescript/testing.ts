import { handlebarTemplate } from './testing.template';
import Handlebars from 'handlebars';
import { Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { formatTypeScript } from '.';
import templates from '../index';

export class TypeScriptTesting implements Template {
	constructor() {}
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);
		const content = tmpl({
			hasServer: generationConfig.config.serverOptions?.present ?? false,
		});
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
