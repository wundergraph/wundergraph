import { OperationType } from '@wundergraph/protobuf';
import { JSONSchema7 } from 'json-schema';
import { GraphQLOperation } from '../graphql/operations';
import { buildPath, JSONSchemaParameterPath } from './operations';

const openAPIVersion = '3.1.0';

const errorSchema: JSONSchema7 = {
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
	schema: JSONSchema7;
}

interface OpenAPIMediaType {
	schema: JSONSchema7;
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

interface OpenAPISpec {
	openapi: string;
	info: OpenAPIInfo;
	servers: OpenAPIServer[];
	paths: Record<string, OpenAPIPath>;
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
						schema: errorSchema,
					},
				},
			},
		};
	}

	// TODO: models.ts has TS return types

	private queryOperation(op: GraphQLOperation): OpenAPIOperation {
		let parameters: OpenAPIParameter[] = [];
		let paths: JSONSchemaParameterPath[] = [];
		buildPath([], false, op.VariablesSchema, paths);
		for (const path of paths) {
			parameters.push({
				name: path.path.join('.'),
				description: `Type ${path.type}, ${path.required ? 'Required' : 'Optional'}`,
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
		};
		return spec;
	}
}
