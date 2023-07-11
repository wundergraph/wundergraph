import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { formatTypeScript } from './index';
import Handlebars from 'handlebars';
import { template } from './jsonschema.template';
import { OperationType, operationTypeToJSON } from '@wundergraph/protobuf';
import { GraphQLOperation } from '../../../graphql/operations';

export class JsonSchema implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const queries = generationConfig.config.application.Operations.filter(
			(op) => op.OperationType === OperationType.QUERY
		).map(operationToModel);
		const mutations = generationConfig.config.application.Operations.filter(
			(op) => op.OperationType === OperationType.MUTATION
		).map(operationToModel);
		const subscriptions = generationConfig.config.application.Operations.filter(
			(op) => op.OperationType === OperationType.SUBSCRIPTION
		).map(operationToModel);
		const model: Model = {
			operations: [...queries, ...mutations, ...subscriptions],
			queries,
			mutations,
			subscriptions,
			hasQueries: queries.length > 0,
			hasMutations: mutations.length > 0,
			hasSubscriptions: subscriptions.length > 0,
			queryNames: generationConfig.config.application.Operations.filter(
				(op) => op.OperationType === OperationType.QUERY
			)
				.map((op) => `"${op.PathName}"`)
				.join(' | '),
			mutationNames: generationConfig.config.application.Operations.filter(
				(op) => op.OperationType === OperationType.MUTATION
			)
				.map((op) => `"${op.PathName}"`)
				.join(' | '),
			subscriptionNames: generationConfig.config.application.Operations.filter(
				(op) => op.OperationType === OperationType.SUBSCRIPTION
			)
				.map((op) => `"${op.PathName}"`)
				.join(' | '),
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

interface Operation {
	name: string;
	inputSchema: string;
	outputSchema: string;
	operationType: string;
	description: string;
}

interface Model {
	operations: Operation[];
	queries: Operation[];
	mutations: Operation[];
	subscriptions: Operation[];
	queryNames: string;
	mutationNames: string;
	subscriptionNames: string;
	hasQueries: boolean;
	hasMutations: boolean;
	hasSubscriptions: boolean;
}

const operationToModel = (op: GraphQLOperation) => ({
	name: op.PathName,
	inputSchema: JSON.stringify(op.VariablesSchema),
	outputSchema: JSON.stringify(op.ResponseSchema),
	operationType: operationTypeToJSON(op.OperationType),
	description: op.Description,
});
