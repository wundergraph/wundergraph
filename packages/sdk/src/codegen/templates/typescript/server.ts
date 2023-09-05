import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { template } from './server.template';
import { TypeScriptClaims } from './claims';
import { WunderGraphHooksPlugin } from './hooks';
import { WunderGraphInternalOperationsApiClient } from './internal.operations.client';

export class WunderGraphServer implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const content = tmpl({
			roleDefinitions: generationConfig.config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
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
		return [new WunderGraphHooksPlugin(), new WunderGraphInternalOperationsApiClient(), new TypeScriptClaims()];
	}
}
