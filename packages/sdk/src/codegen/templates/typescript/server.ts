import { Template, TemplateOutputFile } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript, TypeScriptInputModels, TypeScriptResponseModels } from './index';
import { modelImports } from './web.client';
// @ts-ignore
import { template } from './server.template';
import { WunderGraphHooksPlugin } from './hooks';
import { WunderGraphInternalApiClient } from './internal.client';
import { middlewarePortString } from '../../../env';

export class WunderGraphServer implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const content = tmpl({
			applicationName: config.application.Name,
			modelImports: modelImports(config.application, true),
			operationNamesUnion: config.application.Operations.map((o) => `"${o.Name}"`).join(' | ') || 'never',
			serverPort: middlewarePortString,
			roleDefinitions: config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
		});
		return Promise.resolve([
			{
				path: 'wundergraph.server.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}

	dependencies(): Template[] {
		return [
			new TypeScriptInputModels(),
			new TypeScriptResponseModels(),
			new WunderGraphHooksPlugin(),
			new WunderGraphInternalApiClient(),
		];
	}
}
