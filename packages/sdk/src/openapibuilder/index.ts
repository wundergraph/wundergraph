import { OperationType } from '@wundergraph/protobuf';
import { JSONSchema7 as JSONSchema, JSONSchema7Definition } from 'json-schema';
import objectHash from 'object-hash';
import { GraphQLOperation } from '../graphql/operations';
import { buildPath, JSONSchemaParameterPath } from './operations';
import { deepClone } from '../utils/helper';

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
	tags?: string[];

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
	enableTagAutoGrouping?: boolean;
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
			case OperationType.INVALID:
				throw new Error(`operation ${op.Name} has an invalid type`);
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
			...this.operationTags(op),
			'x-wundergraph-operation-type': operationType,
			'x-wundergraph-requires-authentication': op?.AuthenticationConfig?.required ?? false,
		};
	}

	/*
		Case 1: Defined tags, array ['foo'] or ['foo', 'bar'] => consume these ['foo'] or ['foo', 'bar']
		Case 2: Undefined tags, where operation exists at parent level (operations/foo) => no tags
		Case 3: Undefined tags, where operation exists at a subpath level (operations/foo/bar) => ['foo']
	*/
	private operationTags(op: GraphQLOperation) {
		if (op.Tags && op.Tags.length > 0) {
			return { tags: op.Tags };
		} else if (this.config.enableTagAutoGrouping) {
			const subpaths = op.PathName.split('/');
			const root = subpaths[0];
			if (subpaths.length > 1) {
				const tag = `${root[0].toUpperCase()}${root.slice(1)}`;
				return { tags: [tag] };
			}
		}
		return {};
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

	private rewriteSchemaRefs(spec: OpenApiSpec, schema: JSONSchema7Definition, renames: Map<string, string>) {
		if (typeof schema === 'boolean') {
			return;
		}
		const localRenames: Map<string, string> = new Map();
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
					const prevSchema = spec.components.schemas?.[name];
					if (prevSchema && JSON.stringify(prevSchema) !== JSON.stringify(definition)) {
						// Types have the same name but different definition, we need to rename the
						// new one
						let ii = 2;
						while (true) {
							const rename = `${name}_${ii}`;
							const prevRenamedSchema = spec.components.schemas?.[rename];
							if (!prevRenamedSchema || JSON.stringify(prevRenamedSchema) === JSON.stringify(definition)) {
								spec.components.schemas[rename] = definition;
								localRenames.set(name, rename);
								break;
							}
							ii++;
							if (ii > 100) {
								throw new Error(
									`could not merge schemas for ${name}: ${JSON.stringify(prevSchema)} != ${JSON.stringify(definition)}`
								);
							}
						}
					} else {
						spec.components.schemas[name] = definition;
					}
					this.rewriteSchemaRefs(spec, definition, new Map([...renames, ...localRenames]));
				}
			}
			delete schema.definitions;
		}
		// Rewrite references
		const allRenames = new Map([...renames, ...localRenames]);
		if (schema?.$ref) {
			// Replace #/definitions with #/components/schema (if needed)
			schema.$ref = schema.$ref.replace(/#\/definitions\/([^\/])/, `#/components/schemas/$1`);
			const componentsSchemas = '#/components/schemas/';
			if (schema.$ref.startsWith(componentsSchemas)) {
				const refName = schema.$ref.substring(componentsSchemas.length);
				let renamed = this.validComponentsSchemaName(refName);
				const finalRename = allRenames.get(renamed);
				if (finalRename) {
					renamed = finalRename;
				}
				schema.$ref = componentsSchemas + renamed;
			}
		}
		if (schema?.properties) {
			for (const key of Object.keys(schema.properties)) {
				const prop = schema.properties[key];
				this.rewriteSchemaRefs(spec, prop, allRenames);
			}
		}
		if (schema?.items && typeof schema.items !== 'boolean') {
			if (Array.isArray(schema.items)) {
				for (const item of schema.items) {
					this.rewriteSchemaRefs(spec, item, allRenames);
				}
			} else {
				this.rewriteSchemaRefs(spec, schema.items, allRenames);
			}
		}
		if (schema?.anyOf) {
			for (const item of schema.anyOf) {
				this.rewriteSchemaRefs(spec, item, allRenames);
			}
		}
	}

	private rewriteOperationSchemaRefs(spec: OpenApiSpec, op: OpenApiOperation) {
		for (const input of Object.values(op.requestBody?.content ?? {})) {
			if (input.schema) {
				const schema = deepClone(input.schema);
				this.rewriteSchemaRefs(spec, schema, new Map());
				input.schema = schema;
			}
		}
		for (const response of Object.values(op.responses)) {
			for (const contents of Object.values(response.content)) {
				if (contents.schema) {
					const schema = deepClone(contents.schema);
					this.rewriteSchemaRefs(spec, schema, new Map());
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
					if (op.Description && op.Description !== '') {
						opPath.description = op.Description;
					}
					break;
				case OperationType.MUTATION:
					opPath = {
						post: this.mutationOperation(op),
					};
					if (op.Description && op.Description !== '') {
						opPath.description = op.Description;
					}
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
