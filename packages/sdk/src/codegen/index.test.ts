import { CodeGenOutWriter, collectAllTemplates, GenerateCode, Template, TemplateOutputFile } from './index';
import { Api } from '../definition';
import { CodeGenerationConfig } from '../configure';
import { ConfigurationVariableKind, OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { mapInputVariable } from '../configure/variables';

class FakeTemplate implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const content = generationConfig.config.application.Operations.map((op) => op.Name).join('+');
		return Promise.resolve([
			{
				path: 'testFile.txt',
				content: content,
				doNotEditHeader: false,
			},
		]);
	}
}

class FakeFileSystem implements CodeGenOutWriter {
	files: { [key: string]: string } = {};

	writeFileSync(path: string, content: string): void {
		this.files[path] = content;
	}
}

test('GenerateCode', async () => {
	const out = await RunTemplateTest(new FakeTemplate(), new FakeTemplate());
	expect(out).toEqual({
		'generated/testFile.txt': 'ClosestPlanets+MyReviews+CreatePet+NewPets+MutationWithUnionInput',
	});
});

export const RunTemplateTest = async (...templates: Template[]) => {
	const fakeFileSystem = new FakeFileSystem();
	await GenerateCode(
		{
			basePath: './generated',
			wunderGraphConfig: {
				sdkVersion: 'unknown',
				webhooks: [],
				nodeOptions: {
					nodeUrl: {
						kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
						staticVariableContent: 'http://localhost:9991',
						environmentVariableName: '',
						environmentVariableDefaultValue: '',
						placeholderVariableName: '',
					},
					nodeInternalUrl: {
						kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
						staticVariableContent: 'http://localhost:9993',
						environmentVariableName: '',
						environmentVariableDefaultValue: '',
						placeholderVariableName: '',
					},
					publicNodeUrl: {
						kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
						staticVariableContent: 'http://localhost:9991',
						environmentVariableName: '',
						environmentVariableDefaultValue: '',
						placeholderVariableName: '',
					},
					listen: {
						host: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: 'localhost',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
						port: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '9991',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
					listenInternal: {
						port: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '9993',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
					logger: {
						level: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: 'INFO',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
					defaultRequestTimeoutSeconds: 0,
					defaultHttpProxyUrl: {
						kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
						staticVariableContent: '',
						environmentVariableName: '',
						environmentVariableDefaultValue: '',
						placeholderVariableName: '',
					},
					prometheus: {
						enabled: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
						port: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
					openTelemetry: {
						enabled: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
						sampler: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
						authToken: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
						exporterHttpEndpoint: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
				},
				serverOptions: {
					serverUrl: {
						kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
						staticVariableContent: 'http://localhost:9992',
						environmentVariableName: '',
						environmentVariableDefaultValue: '',
						placeholderVariableName: '',
					},
					listen: {
						host: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: 'localhost',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
						port: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: '9992',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
					logger: {
						level: {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: 'INFO',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					},
				},
				application: {
					Apis: [],
					EngineConfiguration: new Api<any>('', '', [], [], [], []),
					EnableSingleFlight: true,
					S3UploadProvider: [],
					Operations: [
						{
							Name: 'ClosestPlanets',
							Description: '',
							PathName: 'ClosestPlanets',
							Content: 'query ClosestPlanets ($where: db_NodeWhereInput) {\n name \n}',
							OperationType: OperationType.QUERY,
							ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
							VariablesSchema: {
								type: 'object',
								properties: {
									where: {
										$ref: '#/definitions/db_NodeWhereInput',
									},
								},
								additionalProperties: false,
								definitions: {
									db_NodeWhereInput: {
										additionalProperties: false,
										type: ['object', 'null'],
										properties: {
											AND: {
												$ref: '#/definitions/db_NodeWhereInput',
											},
										},
									},
								},
							},
							InterpolationVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InternalVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InjectedVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							ResponseSchema: {
								type: 'object',
								properties: {
									data: {
										type: 'object',
										properties: {
											name: {
												type: 'array',
												items: {
													type: 'string',
													'x-graphql-enum-name': 'Planets',
													enum: ['mercury', 'venus', 'earth'],
												},
											},
										},
										additionalProperties: false,
									},
								},
								additionalProperties: false,
								required: ['data'],
							},
							AuthenticationConfig: {
								required: false,
							},
							AuthorizationConfig: {
								claims: [],
								roleConfig: {
									requireMatchAll: [],
									requireMatchAny: [],
									denyMatchAll: [],
									denyMatchAny: [],
								},
							},
							HooksConfiguration: {
								preResolve: false,
								postResolve: false,
								mutatingPreResolve: false,
								mutatingPostResolve: false,
								mockResolve: {
									enable: false,
									subscriptionPollingIntervalMillis: 0,
								},
								httpTransportOnResponse: false,
								httpTransportOnRequest: false,
								httpTransportOnTransport: false,
								customResolve: false,
							},
							VariablesConfiguration: {
								injectVariables: [],
							},
							Internal: false,
						},
						{
							Name: 'MyReviews',
							Description: '',
							PathName: 'MyReviews',
							Content: 'query MyReviews {\n  me {\n    name\n    reviews {\n      id\n      body\n    }\n  }\n}',
							OperationType: OperationType.QUERY,
							ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
							VariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InterpolationVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InternalVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InjectedVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							ResponseSchema: {
								type: 'object',
								properties: {
									data: {
										type: 'object',
										properties: {
											me: {
												type: 'object',
												properties: {
													name: {
														type: 'string',
													},
													reviews: {
														type: 'array',
														items: {
															type: 'object',
															properties: {
																id: {
																	type: 'string',
																},
																body: {
																	type: 'string',
																},
															},
															additionalProperties: false,
															required: ['id'],
														},
													},
												},
												additionalProperties: false,
											},
										},
										additionalProperties: false,
									},
								},
								additionalProperties: false,
								required: ['data'],
							},
							AuthenticationConfig: {
								required: false,
							},
							AuthorizationConfig: {
								claims: [],
								roleConfig: {
									requireMatchAll: [],
									requireMatchAny: [],
									denyMatchAll: [],
									denyMatchAny: [],
								},
							},
							HooksConfiguration: {
								preResolve: false,
								postResolve: false,
								mutatingPreResolve: false,
								mutatingPostResolve: false,
								mockResolve: {
									enable: false,
									subscriptionPollingIntervalMillis: 0,
								},
								httpTransportOnResponse: false,
								httpTransportOnRequest: false,
								httpTransportOnTransport: false,
								customResolve: false,
							},
							VariablesConfiguration: {
								injectVariables: [],
							},
							Internal: false,
						},
						{
							Name: 'CreatePet',
							Description: '',
							PathName: 'CreatePet',
							Content:
								'mutation CreatePet($petInput: PetInput!) {\n  postPets(petInput: $petInput) {\n    name\n  }\n}',
							OperationType: OperationType.MUTATION,
							ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
							VariablesSchema: {
								type: 'object',
								properties: {
									petInput: {
										$ref: '#/definitions/PetInput',
									},
								},
								additionalProperties: false,
								required: ['petInput'],
								definitions: {
									PetInput: {
										additionalProperties: false,
										type: 'object',
										properties: {
											id: {
												type: 'string',
											},
											name: {
												type: 'string',
											},
										},
										required: ['id'],
									},
								},
							},
							InterpolationVariablesSchema: {
								type: 'object',
								properties: {
									petInput: {
										additionalProperties: false,
										type: 'object',
										properties: {
											id: {
												type: 'string',
											},
											name: {
												type: 'string',
											},
										},
										required: ['id'],
									},
								},
								additionalProperties: false,
								required: ['petInput'],
							},
							InternalVariablesSchema: {
								type: 'object',
								properties: {
									petInput: {
										additionalProperties: false,
										type: 'object',
										properties: {
											id: {
												type: 'string',
											},
											name: {
												type: 'string',
											},
										},
										required: ['id'],
									},
								},
								additionalProperties: false,
								required: ['petInput'],
							},
							InjectedVariablesSchema: {
								type: 'object',
								properties: {
									petInput: {
										additionalProperties: false,
										type: 'object',
										properties: {
											id: {
												type: 'string',
											},
											name: {
												type: 'string',
											},
										},
										required: ['id'],
									},
								},
								additionalProperties: false,
								required: ['petInput'],
							},
							ResponseSchema: {
								type: 'object',
								properties: {
									data: {
										type: 'object',
										properties: {
											postPets: {
												type: 'object',
												properties: {
													name: {
														type: 'string',
													},
												},
												additionalProperties: false,
											},
										},
										additionalProperties: false,
									},
								},
								additionalProperties: false,
								required: ['data'],
							},
							AuthenticationConfig: {
								required: false,
							},
							AuthorizationConfig: {
								claims: [],
								roleConfig: {
									requireMatchAll: [],
									requireMatchAny: [],
									denyMatchAll: [],
									denyMatchAny: [],
								},
							},
							HooksConfiguration: {
								preResolve: false,
								postResolve: false,
								mutatingPreResolve: false,
								mutatingPostResolve: false,
								mockResolve: {
									enable: false,
									subscriptionPollingIntervalMillis: 0,
								},
								httpTransportOnResponse: false,
								httpTransportOnRequest: false,
								httpTransportOnTransport: false,
								customResolve: false,
							},
							VariablesConfiguration: {
								injectVariables: [],
							},
							Internal: false,
						},
						{
							Name: 'NewPets',
							Description: '',
							PathName: 'NewPets',
							Content: 'subscription NewPets {\n  newPets {\n    name\n  }\n}',
							OperationType: OperationType.SUBSCRIPTION,
							ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
							VariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InterpolationVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InternalVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							InjectedVariablesSchema: {
								type: 'object',
								properties: {},
								additionalProperties: false,
							},
							ResponseSchema: {
								type: 'object',
								properties: {
									data: {
										type: 'object',
										properties: {
											newPets: {
												type: 'object',
												properties: {
													name: {
														type: 'string',
													},
												},
												additionalProperties: false,
											},
										},
										additionalProperties: false,
									},
								},
								additionalProperties: false,
								required: ['data'],
							},
							AuthenticationConfig: {
								required: false,
							},
							AuthorizationConfig: {
								claims: [],
								roleConfig: {
									requireMatchAll: [],
									requireMatchAny: [],
									denyMatchAll: [],
									denyMatchAny: [],
								},
							},
							HooksConfiguration: {
								preResolve: false,
								postResolve: false,
								mutatingPreResolve: false,
								mutatingPostResolve: false,
								mockResolve: {
									enable: false,
									subscriptionPollingIntervalMillis: 0,
								},
								httpTransportOnResponse: false,
								httpTransportOnRequest: false,
								httpTransportOnTransport: false,
								customResolve: false,
							},
							VariablesConfiguration: {
								injectVariables: [],
							},
							Internal: false,
						},
						{
							AuthenticationConfig: {
								required: false,
							},
							AuthorizationConfig: {
								claims: [],
								roleConfig: {
									denyMatchAll: [],
									denyMatchAny: [],
									requireMatchAll: [],
									requireMatchAny: [],
								},
							},
							Content:
								'mutation($input:TestType_Input!){test_endpoint(input:$input){...on A_const_container{A_const}...on mutation_test_endpoint_oneOf_1{B}}}',
							Description: '',
							ExecutionEngine: 0,
							HooksConfiguration: {
								customResolve: false,
								httpTransportOnRequest: false,
								httpTransportOnResponse: false,
								httpTransportOnTransport: false,
								mockResolve: {
									enable: false,
									subscriptionPollingIntervalMillis: 0,
								},
								mutatingPostResolve: false,
								mutatingPreResolve: false,
								postResolve: false,
								preResolve: false,
							},
							InjectedVariablesSchema: {
								additionalProperties: false,
								definitions: {
									TestType_Input: {
										oneOf: [
											{
												additionalProperties: false,
												properties: {
													A_const: {
														enum: ['A'],
														type: ['string', 'null'],
														'x-graphql-enum-name': 'A_const',
													},
												},
												type: 'object',
											},
											{
												additionalProperties: false,
												properties: {
													mutation_test_endpoint_oneOf_1_Input: {
														$ref: '#/definitions/mutation_test_endpoint_oneOf_1_Input',
													},
												},
												type: 'object',
											},
										],
										type: 'object',
									},
									mutation_test_endpoint_oneOf_1_Input: {
										additionalProperties: false,
										properties: {
											B: {
												type: ['string', 'null'],
											},
										},
										type: ['object', 'null'],
									},
								},
								properties: {
									input: {
										$ref: '#/definitions/TestType_Input',
									},
								},
								required: ['input'],
								type: 'object',
							},
							Internal: false,
							InternalVariablesSchema: {
								additionalProperties: false,
								definitions: {
									TestType_Input: {
										oneOf: [
											{
												additionalProperties: false,
												properties: {
													A_const: {
														enum: ['A'],
														type: ['string', 'null'],
														'x-graphql-enum-name': 'A_const',
													},
												},
												type: 'object',
											},
											{
												additionalProperties: false,
												properties: {
													mutation_test_endpoint_oneOf_1_Input: {
														$ref: '#/definitions/mutation_test_endpoint_oneOf_1_Input',
													},
												},
												type: 'object',
											},
										],
										type: 'object',
									},
									mutation_test_endpoint_oneOf_1_Input: {
										additionalProperties: false,
										properties: {
											B: {
												type: ['string', 'null'],
											},
										},
										type: ['object', 'null'],
									},
								},
								properties: {
									input: {
										$ref: '#/definitions/TestType_Input',
									},
								},
								required: ['input'],
								type: 'object',
							},
							InterpolationVariablesSchema: {
								additionalProperties: false,
								definitions: {
									TestType_Input: {
										oneOf: [
											{
												additionalProperties: false,
												properties: {
													A_const: {
														enum: ['A'],
														type: ['string', 'null'],
														'x-graphql-enum-name': 'A_const',
													},
												},
												type: 'object',
											},
											{
												additionalProperties: false,
												properties: {
													mutation_test_endpoint_oneOf_1_Input: {
														$ref: '#/definitions/mutation_test_endpoint_oneOf_1_Input',
													},
												},
												type: 'object',
											},
										],
										type: 'object',
									},
									mutation_test_endpoint_oneOf_1_Input: {
										additionalProperties: false,
										properties: {
											B: {
												type: ['string', 'null'],
											},
										},
										type: ['object', 'null'],
									},
								},
								properties: {
									input: {
										$ref: '#/definitions/TestType_Input',
									},
								},
								required: ['input'],
								type: 'object',
							},
							Name: 'MutationWithUnionInput',
							OperationType: 1,
							PathName: 'MutationWithUnionInput',
							PostResolveTransformations: undefined,
							ResponseSchema: {
								additionalProperties: false,
								properties: {
									data: {
										additionalProperties: false,
										properties: {
											test_endpoint: {
												additionalProperties: false,
												properties: {
													A_const: {
														enum: ['A'],
														type: 'string',
													},
													B: {
														type: 'string',
													},
												},
												type: 'object',
											},
										},
										type: 'object',
									},
								},
								type: 'object',
							},
							VariablesConfiguration: {
								injectVariables: [],
							},
							VariablesSchema: {
								additionalProperties: false,
								definitions: {
									TestType_Input: {
										oneOf: [
											{
												additionalProperties: false,
												properties: {
													A_const: {
														enum: ['A'],
														type: ['string', 'null'],
														'x-graphql-enum-name': 'A_const',
													},
												},
												type: 'object',
											},
											{
												additionalProperties: false,
												properties: {
													mutation_test_endpoint_oneOf_1_Input: {
														$ref: '#/definitions/mutation_test_endpoint_oneOf_1_Input',
													},
												},
												type: 'object',
											},
										],
										type: 'object',
									},
									mutation_test_endpoint_oneOf_1_Input: {
										additionalProperties: false,
										properties: {
											B: {
												type: ['string', 'null'],
											},
										},
										type: ['object', 'null'],
									},
								},
								properties: {
									input: {
										$ref: '#/definitions/TestType_Input',
									},
								},
								required: ['input'],
								type: 'object',
							},
						},
					],
					InvalidOperationNames: [],
					CorsConfiguration: {
						maxAge: 120,
						exposedHeaders: ['*'],
						allowedOrigins: [mapInputVariable('*')],
						allowedMethods: ['GET', 'POST'],
						allowedHeaders: ['*'],
						allowCredentials: true,
					},
				},
				deployment: {
					api: {
						id: '',
					},
					environment: {
						baseUrl: 'http://localhost:9991',
						id: '',
					},
				},
				authentication: {
					cookieBased: [],
					authorizedRedirectUris: [],
					authorizedRedirectUriRegexes: [],
					roles: ['admin', 'user'],
					hooks: {
						postAuthentication: false,
						mutatingPostAuthentication: false,
						revalidateAuthentication: false,
						postLogout: false,
					},
					tokenBased: [],
					cookieSecurity: {
						secureCookieHashKey: mapInputVariable(''),
						secureCookieBlockKey: mapInputVariable(''),
						csrfTokenSecret: mapInputVariable(''),
					},
					timeoutSeconds: mapInputVariable(0),
					customClaims: {},
					publicClaims: [],
				},
				enableGraphQLEndpoint: true,
				security: {
					allowedHostNames: [],
				},
				interpolateVariableDefinitionAsJSON: [],
				experimental: {
					orm: false,
				},
			},
			templates,
		},
		fakeFileSystem
	);
	return fakeFileSystem.files;
};

test('should collect all template dependencies recursively and dedupe based on the template name', () => {
	class Template1 implements Template {
		generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
			return Promise.resolve([
				{
					path: 'template1.txt',
					content: '',
					doNotEditHeader: false,
				},
			]);
		}

		dependencies(): Template[] {
			return [new Template2()];
		}
	}

	class Template2 implements Template {
		generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
			return Promise.resolve([
				{
					path: 'template2.txt',
					content: '',
					doNotEditHeader: false,
				},
			]);
		}

		dependencies(): Template[] {
			return [new Template3(), new Template3()];
		}
	}

	class Template3 implements Template {
		generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
			return Promise.resolve([
				{
					path: 'template3.txt',
					content: '',
					doNotEditHeader: false,
				},
			]);
		}
	}

	const templates = Array.from(collectAllTemplates([new Template1()]));

	expect(templates).toHaveLength(3);
	expect(templates[0]).toEqual(new Template1());
	expect(templates[1]).toEqual(new Template2());
	expect(templates[2]).toEqual(new Template3());
});

test('should collect templates up to maxTemplateDepth', () => {
	class Template1 implements Template {
		generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
			return Promise.resolve([
				{
					path: 'template1.txt',
					content: '',
					doNotEditHeader: false,
				},
			]);
		}

		dependencies(): Template[] {
			return [new Template2()];
		}
	}

	class Template2 implements Template {
		generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
			return Promise.resolve([
				{
					path: 'template2.txt',
					content: '',
					doNotEditHeader: false,
				},
			]);
		}

		dependencies(): Template[] {
			return [new Template3(), new Template3()];
		}
	}

	class Template3 implements Template {
		generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
			return Promise.resolve([
				{
					path: 'template3.txt',
					content: '',
					doNotEditHeader: false,
				},
			]);
		}
	}

	const templates = Array.from(collectAllTemplates([new Template1()], 1));

	expect(templates).toHaveLength(2);
	expect(templates[0]).toEqual(new Template1());
	expect(templates[1]).toEqual(new Template2());
});
