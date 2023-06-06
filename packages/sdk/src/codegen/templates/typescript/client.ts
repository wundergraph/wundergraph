import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import Handlebars from 'handlebars';
import { compile as compileJSONSchema } from 'json-schema-to-typescript';

import { handlebarTemplate } from './client.template';
import { Template, TemplateOutputFile } from '../../index';
import { formatTypeScript } from './';
import { OperationType } from '@wundergraph/protobuf';
import { CodeGenerationConfig } from '../../../configure';
import { liveQueries, modelImports, operations, queries as allQueries, configurationHash } from './helpers';
import templates from '../index';
import { isWellKnownClaim, wellKnownClaimField } from '../../../graphql/operations';

// Fields in User that are available even if they're not part of PublicClaims
const alwaysAvailableUserFields = ['expires'];

export class TypeScriptClient implements Template {
	constructor(reactNative: boolean = false) {}
	async generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const config = generationConfig.config;
		const tmpl = Handlebars.compile(handlebarTemplate);
		const allOperations = allQueries(config.application, false);
		const _liveQueries = liveQueries(config.application, false);
		const _queries = operations(config.application, OperationType.QUERY, false);
		const _mutations = operations(config.application, OperationType.MUTATION, false);
		const _subscriptions = operations(config.application, OperationType.SUBSCRIPTION, false);
		const _uploadProfileTypeDefinitions: string[] = [];
		const _uploadProfileTypeNames: Record<string, Record<string, string>> = {};
		for (const provider of config.application.S3UploadProvider) {
			_uploadProfileTypeNames[provider.name] = {};
			for (const key in provider.uploadProfiles) {
				const profile = provider.uploadProfiles[key];
				if (profile.meta) {
					let schema: object;
					if (profile.meta instanceof z.ZodType) {
						try {
							schema = zodToJsonSchema(profile.meta);
						} catch (e: any) {
							throw new Error(`could not convert zod type to JSON schema: ${e}`);
						}
					} else {
						schema = profile.meta;
					}
					const requestedTypeName = `${provider.name}_${key}_metadata`;
					const typeDefinition = await compileJSONSchema(schema, requestedTypeName, {
						additionalProperties: false,
						format: false,
						bannerComment: '',
					});
					// compileJSONSchema might change the typeName capitalization, retrieve it
					const match = typeDefinition.match(/export interface (\w+)/);
					if (!match) {
						throw new Error(`could not retrieve type name from ${typeDefinition}`);
					}
					const typeName = match[1];
					_uploadProfileTypeDefinitions.push(typeDefinition);
					_uploadProfileTypeNames[provider.name][key] = typeName;
				} else {
					_uploadProfileTypeNames[provider.name][key] = 'object';
				}
			}
		}
		const hasAuthProviders = config.authentication.cookieBased.length !== 0;
		const publicWellKnownClaims = generationConfig.config.authentication.publicClaims.filter((claim) =>
			isWellKnownClaim(claim)
		);
		let publicUserFields = publicWellKnownClaims.map((s) => `"${wellKnownClaimField(s)}"`).join(' | ');
		if (publicUserFields.length > 0) {
			const alwaysAvailableUserFieldsDefinition = alwaysAvailableUserFields.map((s) => `"${s}"`).join(' | ');
			publicUserFields = `${publicUserFields} | ${alwaysAvailableUserFieldsDefinition}`;
		}
		const content = tmpl({
			modelImports: modelImports(config.application, false, true),
			baseURL: config.deployment.environment.baseUrl,
			roleDefinitions: config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
			sdkVersion: config.sdkVersion,
			applicationHash: configurationHash(config),
			queries: _queries,
			allOperations: allOperations,
			liveQueries: _liveQueries,
			hasLiveQueries: _liveQueries.length !== 0,
			hasOperations: allOperations.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			subscriptions: _subscriptions,
			hasSubscriptions: _subscriptions.length !== 0,
			hasSubscriptionsOrLiveQueries: _subscriptions.length + _liveQueries.length !== 0,
			hasAuthProviders: config.authentication.cookieBased.length !== 0,
			authProviders: config.authentication.cookieBased.map((provider) => provider.id),
			hasS3Providers: config.application.S3UploadProvider.length > 0,
			s3Providers: config.application.S3UploadProvider.map((provider) => {
				return {
					...provider,
					hasProfiles: Object.keys(provider.uploadProfiles).length,
				};
			}),
			uploadProfileTypeDefinitions: _uploadProfileTypeDefinitions,
			uploadProfileTypeNames: _uploadProfileTypeNames,
			csrfEnabled: hasAuthProviders,
			hasPublicUserFields: publicUserFields.length > 0,
			publicUserFields: publicUserFields,
		});
		return Promise.resolve([
			{
				path: 'client.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
	dependencies(): Template[] {
		return [...templates.typescript.models, templates.typescript.claims];
	}
}
