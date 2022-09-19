import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import { formatTypeScript } from './index';
import Handlebars from 'handlebars';
import { template } from './jsonschema.template';

export class JsonSchema implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const model: Model = {
			operations: config.application.Operations.map((op) => ({
				name: op.Name,
				inputSchema: JSON.stringify(op.VariablesSchema),
				outputSchema: JSON.stringify(op.ResponseSchema),
			})),
		};
		const tmpl = Handlebars.compile(template);
		const content = tmpl(model);
		return Promise.resolve([
			{
				path: 'jsonschema.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

interface Model {
	operations: {
		name: string;
		inputSchema: string;
		outputSchema: string;
	}[];
}
