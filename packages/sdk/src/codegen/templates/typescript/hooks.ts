import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { OperationType } from '@wundergraph/protobuf';
import { filterNodeJSOperations, modelImports, operations } from './helpers';
import { template } from './hooks.template';
import templates from '../index';

export class WunderGraphHooksPlugin implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const application = filterNodeJSOperations(generationConfig.config.application);
		const tmpl = Handlebars.compile(template);
		const _queries = operations(application, OperationType.QUERY, false);
		const _internalQueries = operations(application, OperationType.QUERY, true);
		const _mutations = operations(application, OperationType.MUTATION, false);
		const _internalMutations = operations(application, OperationType.MUTATION, true);
		const _subscriptions = operations(application, OperationType.SUBSCRIPTION, false);
		const _uploadProviders = application.S3UploadProvider;
		console.log(
			'DSSS',
			application.EngineConfiguration.DataSources.filter((ds) => ds.Id !== undefined && ds.Id !== '')
		);
		const content = tmpl({
			modelImports: modelImports(application, true),
			operationNamesUnion: application.Operations.map((o) => `"${o.Name}"`).join(' | ') || 'never',
			dataSourcesUnion:
				application.EngineConfiguration.DataSources.filter((ds) => ds.Id !== undefined && ds.Id !== '')
					.map((ds) => {
						console.log('DS', ds);
						return `"${ds.Id}"`;
					})
					.filter((ds, i, arr) => arr.indexOf(ds) === i)
					.join(' | ') || 'never',
			queries: _queries,
			hasQueries: _queries.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			subscriptions: _subscriptions,
			hasSubscriptions: _subscriptions.length !== 0,
			internalQueries: _internalQueries,
			hasInternalQueries: _internalQueries.length !== 0,
			internalMutations: _internalMutations,
			hasInternalMutations: _internalMutations.length !== 0,
			hasUploadProviders: _uploadProviders.length !== 0,
			uploadProviders: _uploadProviders,
			roleDefinitions: generationConfig.config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
		});
		return Promise.resolve([
			{
				path: 'wundergraph.hooks.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return templates.typescript.models;
	}
}
