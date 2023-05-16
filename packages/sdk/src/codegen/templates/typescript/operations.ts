import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { formatTypeScript } from './index';
import { OperationType } from '@wundergraph/protobuf';
import Handlebars from 'handlebars';
import { template } from './operations.template';
import templates from '../index';

export class Operations implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const model: OperationsModel = {
			operations: generationConfig.config.application.Operations.map((op) => ({
				name: op.Name,
				isMutation: op.OperationType === OperationType.MUTATION,
				isQuery: op.OperationType === OperationType.QUERY,
				isSubscription: op.OperationType === OperationType.SUBSCRIPTION,
			})),
		};
		const tmpl = Handlebars.compile(template);
		const content = tmpl(model);
		return Promise.resolve([
			{
				path: 'wundergraph.operations.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

interface OperationsModel {
	operations: {
		name: string;
		isQuery: boolean;
		isMutation: boolean;
		isSubscription: boolean;
	}[];
}
