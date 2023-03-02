import { OperationType } from '@wundergraph/protobuf';
import { JSONSchema7 as JSONSchema } from 'json-schema';
import { GraphQLOperation } from '../graphql/operations';
import { buildPath, JSONSchemaParameterPath } from './operations';

const openAPIVersion = '3.1.0';

const errorSchema: JSONSchema = {
	type: 'object',
	properties: {
		message: {
			type: 'string',
		},
		input: {}, // any type
		errors: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					propertyPath: {
						type: 'string',
					},
					invalidValue: {}, // any type
					message: {
						type: 'string',
					},
				},
				required: ['propertyPath', 'invalidValue', 'message'],
			},
		},
	},
	required: ['message', 'input', 'errors'],
};

const invalidInputErrorName = 'InvalidInputError';

const errorRefSchema: JSONSchema = {
	$ref: `#/components/schemas/${invalidInputErrorName}`,
};

interface OpenAPIServer {
	url: string;
}

interface OpenAPIInfo {
	title: string;
	version: string;
	summary?: string;
	description?: string;
}

interface OpenAPIParameter {
	name: string;
	description: string;
	in: 'query' | 'header' | 'path' | 'cookie';
	required: boolean;
	allowEmptyValue: boolean;
	schema: JSONSchema;
}

interface OpenAPIMediaType {
	schema: JSONSchema;
}

interface OpenAPIRequestBody {
	description?: string;
	content: Record<string, OpenAPIMediaType>;
	required: boolean;
}

interface OpenAPIResponse {
	description: string;
	content: Record<string, OpenAPIMediaType>;
}

interface OpenAPIOperation {
	operationId: string;
	parameters?: OpenAPIParameter[];
	requestBody?: OpenAPIRequestBody;
	responses: Record<string, OpenAPIResponse>;
}

interface OpenAPIPath {
	$ref?: string;
	summary?: string;
	description?: string;
	get?: OpenAPIOperation;
	post?: OpenAPIOperation;
}

interface OpenAPIComponents {
	schemas?: Record<string, JSONSchema>;
}

interface OpenAPISpec {
	openapi: string;
	info: OpenAPIInfo;
	servers: OpenAPIServer[];
	paths: Record<string, OpenAPIPath>;
	components?: OpenAPIComponents;
}

export interface OpenAPIBuilderOptions {
	baseURL: string;
	title: string;
	summary?: string;
	description?: string;
}

export class OpenAPIBuilder {
	constructor(private config: OpenAPIBuilderOptions) {}

	private operationResponses(op: GraphQLOperation): Record<string, OpenAPIResponse> {
		return {
			'200': {
				description: 'Success',
				content: {
					'application/json': {
						schema: op.ResponseSchema,
					},
				},
			},
			'400': {
				description: 'Invalid input',
				content: {
					'application/json': {
						schema: errorRefSchema,
					},
				},
			},
		};
	}

	private queryOperation(op: GraphQLOperation): OpenAPIOperation {
		let parameters: OpenAPIParameter[] = [];
		let paths: JSONSchemaParameterPath[] = [];
		buildPath([], false, op.VariablesSchema, paths);
		for (const path of paths) {
			parameters.push({
				name: path.path.join('.'),
				description: `Type: ${path.type}`,
				in: 'query',
				required: path.required,
				allowEmptyValue: !path.required,
				schema: {
					type: path.type,
				},
			});
		}

		return {
			operationId: op.Name,
			parameters: parameters,
			responses: this.operationResponses(op),
		};
	}

	private mutationOperation(op: GraphQLOperation): OpenAPIOperation {
		return {
			operationId: op.Name,
			requestBody: {
				content: {
					'application/json': {
						schema: op.VariablesSchema,
					},
				},
				required: true,
			},
			responses: this.operationResponses(op),
		};
	}

	private rewriteSchemaRefs(spec: OpenAPISpec, schema: JSONSchema) {
		// Move definitions to spec
		if (schema?.definitions) {
			if (!spec.components) {
				spec.components = {};
			}
			if (!spec.components.schemas) {
				spec.components.schemas = {};
			}
			for (const key of Object.keys(schema.definitions)) {
				const definition = schema.definitions[key];
				if (typeof definition !== 'boolean') {
					this.rewriteSchemaRefs(spec, definition);
					const prevSchema = spec.components.schemas?.[key];
					if (prevSchema && JSON.stringify(prevSchema) !== JSON.stringify(definition)) {
						throw new Error(
							`could not merge schemas for ${key}: ${JSON.stringify(prevSchema)} != ${JSON.stringify(definition)}`
						);
					}
					spec.components.schemas[key] = definition;
				}
			}
			delete schema.definitions;
		}
		// Rewrite references
		if (schema?.$ref) {
			schema.$ref = schema.$ref.replace(/#\/definitions\/([^\/])/, `#/components/schemas/$1`);
		}
		if (schema?.properties) {
			for (const key of Object.keys(schema.properties)) {
				const prop = schema.properties[key];
				if (typeof prop !== 'boolean') {
					this.rewriteSchemaRefs(spec, prop);
				}
			}
		}
		if (schema?.items && typeof schema.items !== 'boolean') {
			if (Array.isArray(schema.items)) {
				for (const item of schema.items) {
					if (typeof item !== 'boolean') {
						this.rewriteSchemaRefs(spec, item);
					}
				}
			} else {
				this.rewriteSchemaRefs(spec, schema.items);
			}
		}
	}

	private rewriteOperationSchemaRefs(spec: OpenAPISpec, op: OpenAPIOperation) {
		for (const response of Object.values(op.responses)) {
			for (const contents of Object.values(response.content)) {
				this.rewriteSchemaRefs(spec, contents.schema);
			}
		}
	}

	private rewriteAPISchemaRefs(spec: OpenAPISpec) {
		for (const p of Object.values(spec.paths)) {
			if (p.get) {
				this.rewriteOperationSchemaRefs(spec, p.get);
			}
			if (p.post) {
				this.rewriteOperationSchemaRefs(spec, p.post);
			}
		}
		return spec;
	}

	generate(operations: GraphQLOperation[]) {
		let paths: Record<string, OpenAPIPath> = {};

		for (const op of operations) {
			let opPath: OpenAPIPath | undefined;
			switch (op.OperationType) {
				case OperationType.QUERY:
				case OperationType.SUBSCRIPTION:
					opPath = {
						get: this.queryOperation(op),
					};
					break;
				case OperationType.MUTATION:
					opPath = {
						post: this.mutationOperation(op),
					};
					break;
			}
			if (opPath) {
				paths[`/operations/${op.PathName}`] = opPath;
			}
		}

		let schemas: Record<string, JSONSchema> = {};
		schemas[invalidInputErrorName] = errorSchema;

		let spec: OpenAPISpec = {
			openapi: openAPIVersion,
			info: {
				title: this.config.title ? this.config.title : this.config.baseURL,
				version: '1.0',
				summary: this.config.summary,
				description: this.config.description,
			},
			servers: [{ url: this.config.baseURL }],
			paths,
			components: {
				schemas: schemas,
			},
		};
		return this.rewriteAPISchemaRefs(spec);
	}
}
