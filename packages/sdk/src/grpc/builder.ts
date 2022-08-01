import { ObjectTypeComposerFieldConfigAsObjectDefinition, SchemaComposer } from 'graphql-compose';
import { GraphQLBigInt, GraphQLByte, GraphQLJSON, GraphQLUnsignedInt, GraphQLVoid } from 'graphql-scalars';
import { has as lodashHas } from 'lodash';
import protobufjs, { AnyNestedObject, Message, Root } from 'protobufjs';
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor';
import { GraphQLEnumTypeConfig, GraphQLSchema, specifiedDirectives } from 'graphql';

import { getGraphQLScalar, isScalarType } from './scalars';

type DecodedDescriptorSet = Message<IFileDescriptorSet> & IFileDescriptorSet;

export declare type Options = protobufjs.IParseOptions &
	protobufjs.IConversionOptions & {
		includeDirs?: string[];
	};

interface RootConstructor {
	new (options?: Options): Root;
	fromDescriptor(descriptorSet: IFileDescriptorSet | protobufjs.Reader | Uint8Array): Root;
	fromJSON(json: protobufjs.INamespace, root?: Root): Root;
}

function getTypeName(schemaComposer: SchemaComposer, pathWithName: string[] | undefined, isInput: boolean) {
	if (pathWithName?.length) {
		const baseTypeName = pathWithName.filter(Boolean).join('_');
		if (isScalarType(baseTypeName)) {
			return getGraphQLScalar(baseTypeName);
		}
		if (schemaComposer.isEnumType(baseTypeName)) {
			return baseTypeName;
		}
		return isInput ? baseTypeName + '_Input' : baseTypeName;
	}

	return 'Void';
}

export default class GrpcSchemaBuilder {
	private readonly protoSet: Buffer;
	private schemaComposer = new SchemaComposer();

	constructor(protoSet: Buffer) {
		this.protoSet = protoSet;
	}

	async getRootPromiseFromDescriptorProtoSet(): Promise<protobufjs.Root> {
		const decodedDescriptorSet = FileDescriptorSet.decode(this.protoSet) as DecodedDescriptorSet;

		return (Root as RootConstructor).fromDescriptor(decodedDescriptorSet);
	}

	async getDescriptorsSet() {
		const rootPromises: Promise<protobufjs.Root>[] = [];
		const rootPromise = this.getRootPromiseFromDescriptorProtoSet();
		rootPromises.push(rootPromise);

		return Promise.all(
			rootPromises.map(async (root$, i) => {
				const root = await root$;
				const rootName = root.name || `Root${i}`;
				root.resolveAll();
				return {
					name: rootName,
					rootNamespace: root.toJSON({
						keepComments: true,
					}),
				};
			})
		);
	}

	walkToFindTypePath(rootJson: protobufjs.INamespace, pathWithName: string[], baseTypePath: string[]) {
		const currentWalkingPath = [...pathWithName];
		while (!lodashHas(rootJson.nested, currentWalkingPath.concat(baseTypePath).join('.nested.'))) {
			if (!currentWalkingPath.length) {
				break;
			}
			currentWalkingPath.pop();
		}
		return currentWalkingPath.concat(baseTypePath);
	}

	visitEnum(nested: protobufjs.IEnum, typeName: string) {
		const enumTypeConfig: GraphQLEnumTypeConfig = {
			name: typeName,
			values: {},
			description: (nested as any).comment,
		};
		const commentMap = (nested as any).comments;
		for (const [key, value] of Object.entries(nested.values)) {
			enumTypeConfig.values[key] = {
				value,
				description: commentMap?.[key],
			};
		}
		// @ts-ignore
		this.schemaComposer.createEnumTC(enumTypeConfig);
	}

	visitType(nested: protobufjs.IType, typeName: string, rootNamespace: protobufjs.INamespace, pathWithName: string[]) {
		const inputTypeName = typeName + '_Input';
		const outputTypeName = typeName;
		const description = (nested as any).comment;
		const fieldEntries = Object.entries(nested.fields) as [string, protobufjs.IField & { comment: string }][];
		if (fieldEntries.length) {
			const inputTC = this.schemaComposer.createInputTC({
				name: inputTypeName,
				description,
				fields: {},
			});
			const outputTC = this.schemaComposer.createObjectTC({
				name: outputTypeName,
				description,
				fields: {},
			});
			for (const [fieldName, { type, rule, comment }] of fieldEntries) {
				console.log(`Visiting ${currentPath}.nested.fields[${fieldName}]`);
				const baseFieldTypePath = type.split('.');
				inputTC.addFields({
					[fieldName]: {
						type: () => {
							const fieldTypePath = this.walkToFindTypePath(rootNamespace, pathWithName, baseFieldTypePath);
							const fieldInputTypeName = getTypeName(this.schemaComposer, fieldTypePath, true);
							return rule === 'repeated' ? `[${fieldInputTypeName}]` : fieldInputTypeName;
						},
						description: comment,
					},
				});
				outputTC.addFields({
					[fieldName]: {
						type: () => {
							const fieldTypePath = this.walkToFindTypePath(rootNamespace, pathWithName, baseFieldTypePath);
							const fieldTypeName = getTypeName(this.schemaComposer, fieldTypePath, false);
							return rule === 'repeated' ? `[${fieldTypeName}]` : fieldTypeName;
						},
						description: comment,
					},
				});
			}
		} else {
			this.schemaComposer.createScalarTC({
				...GraphQLJSON.toConfig(),
				name: inputTypeName,
				description,
			});
			this.schemaComposer.createScalarTC({
				...GraphQLJSON.toConfig(),
				name: outputTypeName,
				description,
			});
		}
	}

	visitService(nested: protobufjs.IService, rootNamespace: protobufjs.INamespace, pathWithName: string[]) {
		for (const methodName in nested.methods) {
			const method = nested.methods[methodName];
			const rootFieldName = [...pathWithName, methodName].join('_');
			const fieldConfig: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> = {
				type: () => {
					const baseResponseTypePath = method.responseType?.split('.');
					if (baseResponseTypePath) {
						const responseTypePath = this.walkToFindTypePath(rootNamespace, pathWithName, baseResponseTypePath);
						return getTypeName(this.schemaComposer, responseTypePath, false);
					}
					return 'Void';
				},
				description: method.comment,
			};

			fieldConfig.args = {
				// @ts-ignore
				input: () => {
					if (method.requestStream) {
						return 'File';
					}
					const baseRequestTypePath = method.requestType?.split('.');
					if (baseRequestTypePath) {
						const requestTypePath = this.walkToFindTypePath(rootNamespace, pathWithName, baseRequestTypePath);
						return getTypeName(this.schemaComposer, requestTypePath, true);
					}
					return undefined;
				},
			};
			if (method.responseStream) {
				this.schemaComposer.Subscription.addFields({
					[rootFieldName]: {
						...fieldConfig,
					},
				});
			} else {
				const rootTypeComposer = this.schemaComposer.Query;
				rootTypeComposer.addFields({
					[rootFieldName]: {
						...fieldConfig,
					},
				});
			}
		}
	}
	visit({
		nested,
		name,
		currentPath,
		rootNamespace,
	}: {
		nested: AnyNestedObject;
		name: string;
		currentPath: string[];
		rootNamespace: protobufjs.INamespace;
	}) {
		const pathWithName = [...currentPath, ...name.split('.')].filter(Boolean);
		if ('nested' in nested) {
			for (const key in nested.nested) {
				console.log(`Visiting ${currentPath}.nested[${key}]`);
				const currentNested = nested.nested[key];
				this.visit({
					nested: currentNested,
					name: key,
					currentPath: pathWithName,
					rootNamespace: rootNamespace,
				});
			}
		}
		const typeName = pathWithName.join('_');
		if ('values' in nested) {
			this.visitEnum(nested, typeName);
		} else if ('fields' in nested) {
			this.visitType(nested, typeName, rootNamespace, pathWithName);
		} else if ('methods' in nested) {
			this.visitService(nested, rootNamespace, pathWithName);
		}
	}

	async Schema(): Promise<GraphQLSchema> {
		this.schemaComposer.add(GraphQLBigInt);
		this.schemaComposer.add(GraphQLByte);
		this.schemaComposer.add(GraphQLUnsignedInt);
		this.schemaComposer.add(GraphQLVoid);
		this.schemaComposer.add(GraphQLJSON);
		this.schemaComposer.createScalarTC({
			name: 'File',
		});

		const namespaces = await this.getDescriptorsSet();

		for (const { name, rootNamespace } of namespaces) {
			this.visit({ nested: rootNamespace, name: '', currentPath: [], rootNamespace: rootNamespace });
		}

		// graphql-compose doesn't add @defer and @stream to the schema
		specifiedDirectives.forEach((directive) => this.schemaComposer.addDirective(directive));

		return this.schemaComposer.buildSchema();
	}
}
