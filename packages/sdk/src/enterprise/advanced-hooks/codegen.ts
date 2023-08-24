/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Enterprise License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.ENTERPRISE.md
 */

import Handlebars from 'handlebars';

import { handlebarTemplate } from './codegen.template';
import { CodeGenerationConfig } from '../../configure';
import templates from '../../codegen/templates';
import { formatTypeScript } from '../../codegen/templates/typescript';
import { Template, TemplateOutputFile } from '../../codegen';

export class AdvancedHooksTemplate implements Template {
	async generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);

		const content = tmpl({});
		return Promise.resolve([
			{
				path: 'advanced-hooks.d.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
	dependencies() {
		return [templates.typescript.client, templates.typescript.fastifyHooksPlugin];
	}
}
