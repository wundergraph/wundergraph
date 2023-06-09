import { OperationType } from '@wundergraph/protobuf';
import { JSONSchema7 as JSONSchema, JSONSchema7Definition } from 'json-schema';
import objectHash from 'object-hash';
import { GraphQLOperation } from '../graphql/operations';
import { buildPath, JSONSchemaParameterPath } from './operations';

const openApiVersion = '3.1.0';

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

interface OpenApiServer {
	url: string;
}

interface OpenApiInfo {
	title: string;
	version: string;
	summary?: string;
	description?: string;
}

interface OpenApiParameter {
	name: string;
	description: string;
	in: 'query' | 'header' | 'path' | 'cookie';
	required: boolean;
	allowEmptyValue: boolean;
	schema: JSONSchema;
}

interface OpenApiMediaType {
	schema: JSONSchema;
}

interface OpenApiRequestBody {
	description?: string;
	content: Record<string, OpenApiMediaType>;
	required: boolean;
}

interface OpenApiResponse {
	description: string;
	content: Record<string, OpenApiMediaType>;
}

type OperationTypeName = 'query' | 'mutation' | 'subscription';

interface OpenApiOperation {
	operationId: string;
	parameters?: OpenApiParameter[];
	requestBody?: OpenApiRequestBody;
	responses: Record<string, OpenApiResponse>;

	// WunderGraph extensions
	'x-wundergraph-operation-type': OperationTypeName;
	'x-wundergraph-requires-authentication': boolean;
}

interface OpenApiPath {
	$ref?: string;
	summary?: string;
	description?: string;
	get?: OpenApiOperation;
	post?: OpenApiOperation;
}

interface OpenApiComponents {
	schemas?: Record<string, JSONSchema>;
}

interface OpenApiSpec {
	openapi: string;
	info: OpenApiInfo;
	servers: OpenApiServer[];
	paths: Record<string, OpenApiPath>;
	components?: OpenApiComponents;
}

export interface OpenApiBuilderOptions {
	baseURL: string;
	title: string;
	version: string;
	summary?: string;
	description?: string;
}

/**
 * isValidOpenApiSchemaName returns true iff the name is valid
 * to be used as a schema name inside an OAS.
 *
 * @param name Schema name
 * @returns True if the name is valid, false otherwise
 */
export const isValidOpenApiSchemaName = (name: string) => {
	// name must match this regular expression to be a valid schema name in OAS
	return name && name.match(/^[a-zA-Z0-9._-]+$/);
};

// OpenApiBuilder generates an OpenAPI specification for querying the provided operations.
// Each operation should have proper VariablesSchema and ResponseSchema. Query and Subscription
// operations produce GET requests with querystring parameters, while Mutation operations produce
// POST requests with a JSON body. Responses always use JSON.
//
// Due to OpenAPI requirements, the builder needs the base URL as well as the API title and version.
// These can be provided using OpenApiBuilderOptions.
export class OpenApiBuilder {
	constructor(private config: OpenApiBuilderOptions) {}

	private operationResponses(op: GraphQLOperation): Record<string, OpenApiResponse> {
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

	private commonOperation(op: GraphQLOperation) {
		let operationType: OperationTypeName;
		switch (op.OperationType) {
			case OperationType.QUERY:
				operationType = 'query';
				break;
			case OperationType.MUTATION:
				operationType = 'mutation';
				break;
			case OperationType.SUBSCRIPTION:
				operationType = 'subscription';
				break;
		}
		return {
			operationId: op.Name,
			'x-wundergraph-operation-type': operationType,
			'x-wundergraph-requires-authentication': op?.AuthenticationConfig?.required ?? false,
		};
	}

	private queryOperation(op: GraphQLOperation): OpenApiOperation {
		const parameters: OpenApiParameter[] = [];
		const paths: JSONSchemaParameterPath[] = [];
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
			...this.commonOperation(op),
			parameters: parameters,
			responses: this.operationResponses(op),
		};
	}

	private mutationOperation(op: GraphQLOperation): OpenApiOperation {
		return {
			...this.commonOperation(op),
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

	private validComponentsSchemaName(name: string) {
		// If the name is not valid, we use its hash, which will always generate
		// a valid name in a deterministic way
		return isValidOpenApiSchemaName(name) ? name : objectHash(name);
	}

	private rewriteSchemaRefs(spec: OpenApiSpec, schema: JSONSchema7Definition) {
		if (typeof schema === 'boolean') {
			return;
		}
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
					const name = this.validComponentsSchemaName(key);
					this.rewriteSchemaRefs(spec, definition);
					const prevSchema = spec.components.schemas?.[name];
					if (prevSchema && JSON.stringify(prevSchema) !== JSON.stringify(definition)) {
						throw new Error(
							`could not merge schemas for ${name}: ${JSON.stringify(prevSchema)} != ${JSON.stringify(definition)}`
						);
					}
					spec.components.schemas[name] = definition;
				}
			}
			delete schema.definitions;
		}
		// Rewrite references
		if (schema?.$ref) {
			// Replace #/definitions with #/components/schema (if needed)
			schema.$ref = schema.$ref.replace(/#\/definitions\/([^\/])/, `#/components/schemas/$1`);
			const componentsSchemas = '#/components/schemas/';
			if (schema.$ref.startsWith(componentsSchemas)) {
				const refName = schema.$ref.substring(componentsSchemas.length);
				const renamed = this.validComponentsSchemaName(refName);
				schema.$ref = componentsSchemas + renamed;
			}
		}
		if (schema?.properties) {
			for (const key of Object.keys(schema.properties)) {
				const prop = schema.properties[key];
				this.rewriteSchemaRefs(spec, prop);
			}
		}
		if (schema?.items && typeof schema.items !== 'boolean') {
			if (Array.isArray(schema.items)) {
				for (const item of schema.items) {
					this.rewriteSchemaRefs(spec, item);
				}
			} else {
				this.rewriteSchemaRefs(spec, schema.items);
			}
		}
		if (schema?.anyOf) {
			for (const item of schema.anyOf) {
				this.rewriteSchemaRefs(spec, item);
			}
		}
	}

	private rewriteOperationSchemaRefs(spec: OpenApiSpec, op: OpenApiOperation) {
		for (const input of Object.values(op.requestBody?.content ?? {})) {
			if (input.schema) {
				const schema = JSON.parse(JSON.stringify(input.schema));
				this.rewriteSchemaRefs(spec, schema);
				input.schema = schema;
			}
		}
		for (const response of Object.values(op.responses)) {
			for (const contents of Object.values(response.content)) {
				if (contents.schema) {
					const schema = JSON.parse(JSON.stringify(contents.schema));
					this.rewriteSchemaRefs(spec, schema);
					contents.schema = schema;
				}
			}
		}
	}

	private rewriteAPISchemaRefs(spec: OpenApiSpec) {
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

	build(operations: GraphQLOperation[]) {
		const paths: Record<string, OpenApiPath> = {};

		for (const op of operations) {
			if (op.Internal) {
				continue;
			}
			let opPath: OpenApiPath | undefined;
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
				paths[`/${op.PathName}`] = opPath;
			}
		}

		const schemas: Record<string, JSONSchema> = {};
		schemas[invalidInputErrorName] = errorSchema;

		const spec: OpenApiSpec = {
			openapi: openApiVersion,
			info: {
				title: this.config.title ? this.config.title : this.config.baseURL,
				version: this.config.version,
			},
			servers: [{ url: `${this.config.baseURL}/operations` }],
			paths,
			components: {
				schemas: schemas,
			},
		};
		if (this.config.summary) {
			spec.info.summary = this.config.summary;
		}
		if (this.config.description) {
			spec.info.description = this.config.description;
		}
		return this.rewriteAPISchemaRefs(spec);
	}
}
