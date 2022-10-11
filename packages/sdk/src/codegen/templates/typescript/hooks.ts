import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { OperationType } from '@wundergraph/protobuf';
import { modelImports, operations } from './helpers';
import { template } from './hooks.template';
import templates from '../index';

export class WunderGraphHooksPlugin implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const _queries = operations(config.application, OperationType.QUERY, false);
		const _internalQueries = operations(config.application, OperationType.QUERY, true);
		const _mutations = operations(config.application, OperationType.MUTATION, false);
		const _internalMutations = operations(config.application, OperationType.MUTATION, true);
		const content = tmpl({
			applicationName: config.application.Name,
			modelImports: modelImports(config.application, true),
			operationNamesUnion: config.application.Operations.map((o) => `"${o.Name}"`).join(' | ') || 'never',
			apiIDsUnion:
				config.application.EngineConfiguration.DataSources.filter((ds) => ds.Id !== undefined && ds.Id !== '')
					.map((ds) => `"${ds.Id}"`)
					.join(' | ') || 'never',
			queries: _queries,
			hasQueries: _queries.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			internalQueries: _internalQueries,
			hasInternalQueries: _internalQueries.length !== 0,
			internalMutations: _internalMutations,
			hasInternalMutations: _internalMutations.length !== 0,
			roleDefinitions: config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
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
