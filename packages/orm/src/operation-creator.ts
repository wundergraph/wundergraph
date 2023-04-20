import { OperationTypeNode, GraphQLSchema, getNamedType, print } from 'graphql';
import {
	field,
	selectionSet,
	Field,
	SelectionSet,
	Result,
	argument,
	variable,
	VariableDefinition,
	variableDefinition,
	operation,
	document,
} from '@timkendall/tql';

import type { NamedType } from './definition';
import { defaultSelection, type DefaultSelection } from './selections';

import { OperationBuilder } from './operation-builder';
import { Executor } from './executor';

interface OperationCreatorConfig {
	// @todo replace with type-annotated `SchemaDefinitionNode`
	schema: Record<string, any>;
}

type RootType = 'Query' | 'Mutation' | 'Subscription';

interface TypeToOperation {
	Query: OperationTypeNode.QUERY;
	Mutation: OperationTypeNode.MUTATION;
	Subscription: OperationTypeNode.SUBSCRIPTION;
}

type RootMethod<Config extends OperationCreatorConfig, Type extends RootType> = <
	RootField extends Extract<Exclude<keyof Config['schema'][Type], '__typename'>, string>
>(
	field: RootField
) => OperationBuilder<{
	schema: Config['schema'];
	operation: TypeToOperation[Type];
	// root type (e.g Query, Mutation, or Subscription)
	rootType: Config['schema'][Type];
	// name of the root field
	rootField: RootField;
	// return type of the root field that was selected
	type: NonNullable<ReturnType<Config['schema'][Type][RootField]>>;
	// selection set created for the root field type
	typeSelection: NonNullable<ReturnType<Config['schema'][Type][RootField]>> extends { __abstract: true }
		? SelectionSet<[Field<'__typename'>]>
		: DefaultSelection<NamedType<NonNullable<ReturnType<Config['schema'][Type][RootField]>>>>;
	// fragment definitions (for selecting on abstract types)
	fragmentDefinitions: [];
}>;

export class OperationCreator<Config extends OperationCreatorConfig> {
	constructor(private readonly config: { schema: GraphQLSchema; executor: Executor }) {}

	query: RootMethod<Config, 'Query'> = (rootField) => {
		const rootType = OperationTypeNode.QUERY;
		if (!this.config.schema.getRootType(rootType)) {
			throw new Error(`Schema does not support operation type "${rootType}".`);
		}

		return this.#create(OperationTypeNode.QUERY, rootField) as any;
	};

	mutate: RootMethod<Config, 'Mutation'> = (rootField) => {
		const rootType = OperationTypeNode.MUTATION;
		if (!this.config.schema.getRootType(rootType)) {
			throw new Error(`Schema does not support operation type "${rootType}".`);
		}

		return this.#create(OperationTypeNode.MUTATION, rootField) as any;
	};

	subscribe: RootMethod<Config, 'Subscription'> = (rootField) => {
		const rootType = OperationTypeNode.SUBSCRIPTION;
		if (!this.config.schema.getRootType(rootType)) {
			throw new Error(`Schema does not support operation type "${rootType}".`);
		}

		return this.#create(OperationTypeNode.SUBSCRIPTION, rootField) as any;
	};

	#create(rootType: OperationTypeNode, rootField: string) {
		const type = this.config.schema.getRootType(rootType)?.getFields()?.[rootField]?.type;
		if (!type) {
			throw new Error(`Schema does not support field "${rootField}" on operation "${rootType}".`);
		}

		// unwrap `GraphQLNonNull` and `GraphQLList` types
		const unwrappedType = getNamedType(type);
		// construct the default selection on the selected root type
		const selection = defaultSelection(unwrappedType);

		return new OperationBuilder({
			schema: this.config.schema,
			rootType,
			rootField,
			type: unwrappedType,
			typeSelection: selection,
			executor: this.config.executor,
		});
	}
}
