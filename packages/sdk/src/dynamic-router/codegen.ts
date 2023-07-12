import Handlebars from 'handlebars';

import { handlebarTemplate } from './codegen.template';
import { CodeGenerationConfig } from '../configure';
import templates from '../codegen/templates';
import { formatTypeScript } from '../codegen/templates/typescript';
import { Template, TemplateOutputFile } from '../codegen';

export class DynamicRouterTemplate implements Template {
	async generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const config = generationConfig.config;
		const tmpl = Handlebars.compile(handlebarTemplate);

		const content = tmpl({});
		return Promise.resolve([
			{
				path: 'dynamic-router.d.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
	dependencies() {
		return [templates.typescript.client, templates.typescript.fastifyHooksPlugin];
	}
}
