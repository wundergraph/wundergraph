import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { template } from './server.template';
import { WunderGraphHooksPlugin } from './hooks';
import { WunderGraphInternalApiClient } from './internal.client';
import { WunderGraphInternalOperationsApiClient } from './internal.operations.client';

export class WunderGraphServer implements Template {
	generate(config: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const content = tmpl({
			roleDefinitions: config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
		});
		return Promise.resolve([
			{
				path: 'wundergraph.server.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [
			new WunderGraphHooksPlugin(),
			new WunderGraphInternalApiClient(),
			new WunderGraphInternalOperationsApiClient(),
		];
	}
}
