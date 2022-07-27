import { ObjectTypeComposerFieldConfigAsObjectDefinition, SchemaComposer } from 'graphql-compose';
import { GraphQLBigInt, GraphQLByte, GraphQLJSON, GraphQLUnsignedInt, GraphQLVoid } from 'graphql-scalars';
import { has as lodashHas } from 'lodash';
import protobufjs, { AnyNestedObject, Message, Root, RootConstructor } from 'protobufjs';
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor';
import { GraphQLEnumTypeConfig, specifiedDirectives } from 'graphql';

import { getGraphQLScalar, isScalarType } from './scalars';

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

type DecodedDescriptorSet = Message<IFileDescriptorSet> & IFileDescriptorSet;

export default class GrpcHandler {
	async getRootPromiseFromDescriptorFilePath() {
		const descriptorSetBuffer = Buffer.from('');

		let decodedDescriptorSet: DecodedDescriptorSet;
		decodedDescriptorSet = FileDescriptorSet.decode(descriptorSetBuffer) as DecodedDescriptorSet;

		return (Root as RootConstructor).fromDescriptor(decodedDescriptorSet);
	}

	async getCachedDescriptorSets() {
		const rootPromises: Promise<protobufjs.Root>[] = [];
		console.log(`Building Roots`);

		const rootPromise = this.getRootPromiseFromDescriptorFilePath();
		rootPromises.push(rootPromise);

		return Promise.all(
			rootPromises.map(async (root$, i) => {
				const root = await root$;
				const rootName = root.name || `Root${i}`;
				console.log(`Resolving entire the root tree`);
				root.resolveAll();
				console.log(`Creating artifacts from descriptor set and root`);
				return {
					name: rootName,
					rootJson: root.toJSON({
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

	visit({
		nested,
		name,
		currentPath,
		rootJson,
	}: {
		nested: AnyNestedObject;
		name: string;
		currentPath: string[];
		rootJson: protobufjs.INamespace;
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
					rootJson,
				});
			}
		}
		const typeName = pathWithName.join('_');
		if ('values' in nested) {
			const enumTypeConfig: GraphQLEnumTypeConfig = {
				name: typeName,
				values: {},
				description: (nested as any).comment,
			};
			const commentMap = (nested as any).comments;
			for (const [key, value] of Object.entries(nested.values)) {
				console.log(`Visiting ${currentPath}.nested.values[${key}]`);
				enumTypeConfig.values[key] = {
					value,
					description: commentMap?.[key],
				};
			}
			this.schemaComposer.createEnumTC(enumTypeConfig);
		} else if ('fields' in nested) {
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
								const fieldTypePath = this.walkToFindTypePath(rootJson, pathWithName, baseFieldTypePath);
								const fieldInputTypeName = getTypeName(this.schemaComposer, fieldTypePath, true);
								return rule === 'repeated' ? `[${fieldInputTypeName}]` : fieldInputTypeName;
							},
							description: comment,
						},
					});
					outputTC.addFields({
						[fieldName]: {
							type: () => {
								const fieldTypePath = this.walkToFindTypePath(rootJson, pathWithName, baseFieldTypePath);
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
		} else if ('methods' in nested) {
			for (const methodName in nested.methods) {
				const method = nested.methods[methodName];
				const rootFieldName = [...pathWithName, methodName].join('_');
				const fieldConfig: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> = {
					type: () => {
						const baseResponseTypePath = method.responseType?.split('.');
						if (baseResponseTypePath) {
							const responseTypePath = this.walkToFindTypePath(rootJson, pathWithName, baseResponseTypePath);
							return getTypeName(this.schemaComposer, responseTypePath, false);
						}
						return 'Void';
					},
					description: method.comment,
				};
				fieldConfig.args = {
					input: () => {
						if (method.requestStream) {
							return 'File';
						}
						const baseRequestTypePath = method.requestType?.split('.');
						if (baseRequestTypePath) {
							const requestTypePath = this.walkToFindTypePath(rootJson, pathWithName, baseRequestTypePath);
							const requestTypeName = getTypeName(this.schemaComposer, requestTypePath, true);
							return requestTypeName;
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
	}

	private schemaComposer = new SchemaComposer();

	async getMeshSource() {
		this.schemaComposer.add(GraphQLBigInt);
		this.schemaComposer.add(GraphQLByte);
		this.schemaComposer.add(GraphQLUnsignedInt);
		this.schemaComposer.add(GraphQLVoid);
		this.schemaComposer.add(GraphQLJSON);
		this.schemaComposer.createScalarTC({
			name: 'File',
		});

		console.log(`Getting stored root and decoded descriptor set objects`);
		const artifacts = await this.getCachedDescriptorSets();

		for (const { name, rootJson } of artifacts) {
			console.log(`Building the schema structure based on the root object`);
			this.visit({ nested: rootJson, name: '', currentPath: [], rootJson });
		}

		// graphql-compose doesn't add @defer and @stream to the schema
		specifiedDirectives.forEach((directive) => this.schemaComposer.addDirective(directive));

		console.log(`Building the final GraphQL Schema`);
		const schema = this.schemaComposer.buildSchema();

		return {
			schema,
		};
	}
}
