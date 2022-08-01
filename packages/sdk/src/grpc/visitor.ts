import protobufjs, { AnyNestedObject } from 'protobufjs';
import { GraphQLEnumTypeConfig } from 'graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { ObjectTypeComposerFieldConfigAsObjectDefinition, SchemaComposer } from 'graphql-compose';
import { getGraphQLScalar, isScalarType } from './scalars';
import { has as lodashHas } from 'lodash';

enum QueryType {
	query = 1,
	mutation = 2,
	subscription = 3,
}

export interface MethodInfo {
	type: QueryType;
	package: string;
	service: string;
	method: string;
	fieldName: string;
}

export default class DescriptorVisitor {
	private readonly schemaComposer: SchemaComposer;
	private readonly rootNamespace: protobufjs.INamespace;
	private readonly enableSubscriptions: boolean;
	private readonly methods: MethodInfo[];

	constructor(schemaComposer: SchemaComposer, rootNamespace: protobufjs.INamespace, enableSubscriptions: boolean) {
		this.schemaComposer = schemaComposer;
		this.rootNamespace = rootNamespace;
		this.enableSubscriptions = enableSubscriptions;
		this.methods = [];
	}

	getTypeName(pathWithName: string[] | undefined, isInput: boolean) {
		if (pathWithName?.length) {
			const baseTypeName = pathWithName.filter(Boolean).join('_');
			if (isScalarType(baseTypeName)) {
				return getGraphQLScalar(baseTypeName);
			}
			if (this.schemaComposer.isEnumType(baseTypeName)) {
				return baseTypeName;
			}
			return isInput ? baseTypeName + '_Input' : baseTypeName;
		}

		return 'Void';
	}

	walkToFindTypePath(pathWithName: string[], baseTypePath: string[]) {
		const currentWalkingPath = [...pathWithName];
		while (!lodashHas(this.rootNamespace.nested, currentWalkingPath.concat(baseTypePath).join('.nested.'))) {
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

	visitType(nested: protobufjs.IType, typeName: string, pathWithName: string[]) {
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
				// console.log(`Visiting ${currentPath}.nested.fields[${fieldName}]`);
				const baseFieldTypePath = type.split('.');
				inputTC.addFields({
					[fieldName]: {
						type: () => {
							const fieldTypePath = this.walkToFindTypePath(pathWithName, baseFieldTypePath);
							const fieldInputTypeName = this.getTypeName(fieldTypePath, true);
							return rule === 'repeated' ? `[${fieldInputTypeName}]` : fieldInputTypeName;
						},
						description: comment,
					},
				});
				outputTC.addFields({
					[fieldName]: {
						type: () => {
							const fieldTypePath = this.walkToFindTypePath(pathWithName, baseFieldTypePath);
							const fieldTypeName = this.getTypeName(fieldTypePath, false);
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

	visitService(nested: protobufjs.IService, pathWithName: string[]) {
		for (const methodName in nested.methods) {
			const method = nested.methods[methodName];
			const rootFieldName = [...pathWithName, methodName].join('_');

			const [packageName, serviceName] = pathWithName;
			const methodInfo: MethodInfo = {
				package: packageName,
				service: serviceName,
				method: methodName,
				fieldName: rootFieldName,
				type: QueryType.query,
			};

			const fieldConfig: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> = {
				type: () => {
					const baseResponseTypePath = method.responseType?.split('.');
					if (baseResponseTypePath) {
						const responseTypePath = this.walkToFindTypePath(pathWithName, baseResponseTypePath);
						return this.getTypeName(responseTypePath, false);
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
						const requestTypePath = this.walkToFindTypePath(pathWithName, baseRequestTypePath);
						return this.getTypeName(requestTypePath, true);
					}
					return undefined;
				},
			};

			if (method.responseStream) {
				if (!this.enableSubscriptions) {
					continue;
				}

				this.schemaComposer.Subscription.addFields({
					[rootFieldName]: {
						...fieldConfig,
					},
				});

				methodInfo.type = QueryType.subscription;
				this.methods.push(methodInfo);
			} else {
				const rootTypeComposer = this.schemaComposer.Query;
				rootTypeComposer.addFields({
					[rootFieldName]: {
						...fieldConfig,
					},
				});
				this.methods.push(methodInfo);
			}
		}
	}

	Visit({ nested, name, currentPath }: { nested: AnyNestedObject; name: string; currentPath: string[] }) {
		const pathWithName = [...currentPath, ...name.split('.')].filter(Boolean);
		if ('nested' in nested) {
			for (const key in nested.nested) {
				// console.log(`Visiting ${currentPath}.nested[${key}]`);
				const currentNested = nested.nested[key];
				this.Visit({
					nested: currentNested,
					name: key,
					currentPath: pathWithName,
				});
			}
		}
		const typeName = pathWithName.join('_');
		if ('values' in nested) {
			this.visitEnum(nested, typeName);
		} else if ('fields' in nested) {
			this.visitType(nested, typeName, pathWithName);
		} else if ('methods' in nested) {
			this.visitService(nested, pathWithName);
		}
	}

	Methods(): MethodInfo[] {
		return this.methods;
	}
}
