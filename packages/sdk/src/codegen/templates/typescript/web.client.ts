import { Template, TemplateOutputFile } from '../../index';
import { ResolvedApplication, ResolvedWunderGraphConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { OperationType } from '@wundergraph/protobuf';
import hash from 'object-hash';
import { template } from './web.client.template';
import { hasInjectedInput, hasInternalInput, hasInput } from './helpers';

export class TypeScriptLegacyWebClient implements Template {
	constructor(reactNative?: boolean) {
		this.reactNative = reactNative || false;
	}

	private readonly reactNative: boolean;

	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const _queries = operations(config.application, OperationType.QUERY, false);
		const _liveQueries = liveQueries(config.application, false);
		const _mutations = operations(config.application, OperationType.MUTATION, false);
		const _subscriptions = operations(config.application, OperationType.SUBSCRIPTION, false);
		const content = tmpl({
			modelImports: modelImports(config.application, false),
			baseURL: config.deployment.environment.baseUrl,
			sdkVersion: config.sdkVersion,
			applicationPath: config.deployment.path,
			applicationHash: hash(config).substring(0, 8),
			queries: _queries,
			liveQueries: _liveQueries,
			hasLiveQueries: _liveQueries.length !== 0,
			hasQueries: _queries.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			subscriptions: _subscriptions,
			hasSubscriptions: _subscriptions.length !== 0,
			hasSubscriptionsOrLiveQueries: _subscriptions.length + _liveQueries.length !== 0,
			authProviders: config.authentication.cookieBased.map((provider) => provider.id),
			hasAuthProviders: config.authentication.cookieBased.length !== 0,
			hasS3Provider: config.application.S3UploadProvider.length > 0,
			s3Provider: config.application.S3UploadProvider,
			reactNative: this.reactNative,
		});
		return Promise.resolve([
			{
				path: 'wundergraph.client.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
}

const filteredOperations = (application: ResolvedApplication, includeInternal: boolean) =>
	includeInternal ? application.Operations : application.Operations.filter((op) => !op.Internal);

export const operations = (application: ResolvedApplication, operationType: OperationType, includeInternal: boolean) =>
	filteredOperations(application, includeInternal)
		.filter((op) => op.OperationType === operationType)
		.map((op) => {
			return {
				operationName: op.Name,
				path: op.Name,
				hasInput: hasInput(op),
				hasInternalInput: hasInternalInput(op),
				requiresAuthentication: op.AuthenticationConfig.required,
			};
		});

export const liveQueries = (application: ResolvedApplication, includeInternal: boolean) =>
	filteredOperations(application, includeInternal)
		.filter((op) => op.OperationType === OperationType.QUERY && op.LiveQuery && op.LiveQuery.enable)
		.map((op) => {
			return {
				operationName: op.Name,
				path: op.Name,
				hasInput: hasInput(op),
				hasInternalInput: hasInternalInput(op),
				requiresAuthentication: op.AuthenticationConfig.required,
			};
		});

export const modelImports = (
	application: ResolvedApplication,
	includeInternal: boolean,
	includeResponseData?: boolean
): string => {
	return filteredOperations(application, includeInternal)
		.map((op) => {
			let out = `${op.Name}Response`;
			if (hasInput(op)) {
				out += `,${op.Name}Input`;
			}
			if (includeInternal && hasInternalInput(op)) {
				out += `,Internal${op.Name}Input`;
			}
			if (includeInternal && hasInjectedInput(op)) {
				out += `,Injected${op.Name}Input`;
			}
			if (includeResponseData === true) {
				out += `,${op.Name}ResponseData`;
			}
			return out;
		})
		.join(',');
};
