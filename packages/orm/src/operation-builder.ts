import type { Tuples, Strings, Call } from 'hotscript';
import {
	OperationTypeNode,
	GraphQLSchema,
	visit,
	visitWithTypeInfo,
	TypeInfo,
	GraphQLNamedOutputType,
	GraphQLArgument,
	isObjectType,
	isAbstractType,
	getNamedType,
} from 'graphql';
import {
	field,
	selectionSet,
	Field,
	SelectionSet,
	argument,
	Argument,
	variable,
	VariableDefinition,
	variableDefinition,
	operation,
	document,
	FragmentDefinition,
	NamedType as NamedTypedDef,
	FragmentSpread,
	inlineFragment,
	namedType,
} from '@timkendall/tql';
import { pathOr } from 'remeda';
import { from } from 'ix/asynciterable'
import { map } from 'ix/asynciterable/operators';

import { NamedType } from './definition';
import { ArgumentDefinitions, type AbstractTypesInSelection } from './selections';
import { Paths, ToSelectionSet, toSelectionSet } from './paths';
import { FragmentDefinitionBuilder } from './fragment-definition-builder';
import { AddFragment } from './add-fragment-selection';
import { Result } from './result';
import { Executor } from './executor';

export interface OperationBuilderConfig {
	// @todo replace w/SchemaDefinitionNode (or thin TypeScript wrapper of `SchemaDefinition`)
	schema: Record<string, any>;
	operation: OperationTypeNode;
	// @todo replace w/ObjectTypeDefinitionNode (or thin TypeScript wrapper of `ObjectTypeDefinition`)
	rootType: Record<string, any>;
	rootField: string;
	type: Record<string, any>;
	typeSelection: SelectionSet<any>;
	fragmentDefinitions: ReadonlyArray<FragmentDefinition<any, any, any>>;
}

type SelectMethod<Config extends OperationBuilderConfig> = <Selected extends Array<Paths<NamedType<Config['type']>>>>(
	...paths: Selected
) => OperationBuilder<{
	schema: Config['schema'];
	operation: Config['operation'];
	rootType: Config['rootType'];
	rootField: Config['rootField'];
	type: Config['type'];
	typeSelection: ToSelectionSet<Call<Tuples.Map<Strings.Split<'.'>>, Selected>>;
	// @fixme we get `[...any[], ..]`
	fragmentDefinitions: []; // Config['fragmentDefinitions']
}>;

type WhereMethod<Config extends OperationBuilderConfig> = <
	T extends Exclude<
		ArgumentDefinitions<
			Config['schema'],
			Config['rootType'],
			SelectionSet<[Field<Config['rootField'], undefined, Config['typeSelection']>]>
		>,
		undefined
	>[Config['rootField']]
>(
	variables: T
) => OperationBuilder<{
	schema: Config['schema'];
	operation: Config['operation'];
	rootType: Config['rootType'];
	rootField: Config['rootField'];
	type: Config['type'];
	typeSelection: Config['typeSelection'];
	// @fixme we get `[...any[], ..]`
	fragmentDefinitions: []; // Config['fragmentDefinitions']
}>;

type OnMethod<Config extends OperationBuilderConfig> = <
	// collect abstract types in current selection
	Typename extends AbstractTypesInSelection<
		Config['schema'],
		Config['rootType'],
		SelectionSet<[Field<Config['rootField']>]>
	>,
	BuildSelectionCb extends (
		builder: FragmentDefinitionBuilder<{
			schema: Config['schema'];
			typename: Typename;
			type: Config['schema'][Typename];
			selection: SelectionSet<any>;
		}>
	) => FragmentDefinitionBuilder<{
		schema: Config['schema'];
		typename: Typename;
		type: Config['schema'][Typename];
		selection: SelectionSet<any>;
	}>
>(
	typename: Typename,
	buildSelection: BuildSelectionCb
) => OperationBuilder<{
	schema: Config['schema'];
	operation: Config['operation'];
	rootType: Config['rootType'];
	rootField: Config['rootField'];
	type: Config['type'];

	// Modify type selection to include selections (via. fragments) on each possible type
	typeSelection: Config['type'] extends { __abstract: true }
		? AddFragment<
				// the abstract type
				Config['type'],
				Config['typeSelection'],
				// `FragmentDefinition`
				ReturnType<ReturnType<BuildSelectionCb>['compile']>
		  >
		: Config['typeSelection'];

	fragmentDefinitions: [...Config['fragmentDefinitions'], ReturnType<ReturnType<BuildSelectionCb>['compile']>];
}>;

type ExecMethod<Config extends OperationBuilderConfig> =
	() => Config['operation'] extends OperationTypeNode.SUBSCRIPTION
		? Promise<AsyncGenerator<Result<Config['schema'], Config['type'], Config['typeSelection']>>>
		: Promise<Result<Config['schema'], Config['type'], Config['typeSelection']>>;

export class OperationBuilder<Config extends OperationBuilderConfig> {
	// @todo replace with a single `#selectionSet` member and `get #typeSelection` computed member
	#rootSelection: SelectionSet<any>;
	#typeSelection: SelectionSet<any> | undefined;

	#variableCounter = -1;
	#variableDefinitions = new Set<VariableDefinition<any, any>>();
	#variableValues = new Map<VariableDefinition<any, any>, unknown>();

	#fragmentDefinitions = new Map<string, FragmentDefinition<any, any, any>>();

	// @note just used for type-level debugging for now
	// @note if we unify the `Config` type paramater and `config` constructor argument types this could be removed
	__config!: Config;

	constructor(
		public readonly config: {
			schema: GraphQLSchema;
			type: GraphQLNamedOutputType;
			rootType: OperationTypeNode;
			rootField: string;
			typeSelection: SelectionSet<any> | undefined;
			executor: Executor;
		}
	) {
		this.#rootSelection = selectionSet([field(this.config.rootField, undefined, this.config.typeSelection)]);
		this.#typeSelection = config.typeSelection;
	}

	#defineVariable(argumentDefinition: GraphQLArgument, value: unknown) {
		// create a unqiue (but still readable) name for the variable
		const name = `${argumentDefinition.name}_${++this.#variableCounter}`;
		if (!argumentDefinition.astNode?.type) {
			throw new Error('Unable to determine argument type from schema.');
		}
		const definition = variableDefinition(variable(name), argumentDefinition.astNode.type);

		this.#variableDefinitions.add(definition);
		this.#variableValues.set(definition, value);

		return definition.variable;
	}

	get variables(): Record<string, unknown> {
		return Object.fromEntries(
			Array.from(this.#variableValues.entries()).map(([variableDefinition, value]) => [
				variableDefinition.variable.name.value,
				value,
			])
		);
	}

	where: WhereMethod<Config> = (variables) => {
		const rootType = this.config.schema.getRootType(this.config.rootType);
		const typeInfo = new TypeInfo(this.config.schema, rootType);

		// keep track of the argument path (so that we can lookup the correct value in `variables`)
		const selectionPath: string[] = [];

		const visitor = visitWithTypeInfo(typeInfo, {
			Field: {
				enter: (node) => {
					const fieldDef = typeInfo.getFieldDef();

					selectionPath.push(node.name.value);
					const [_root /* always ignore */, ...rest] = selectionPath;

					const currentFieldArguments = Object.fromEntries(node.arguments?.map((arg) => [arg.name.value, arg]) ?? []);
					const newFieldArguments = Object.fromEntries(
						fieldDef?.args
							?.map((argDef) => {
								const argumentPath = [...rest, argDef.name];
								const argumentValue = pathOr(variables as any, argumentPath as any, undefined);

								if (argumentValue) {
									return [argDef.name, argument(argDef.name, this.#defineVariable(argDef, argumentValue))];
								} else {
									return [argDef.name, undefined];
								}
							})
							.filter(([_, argValue]) => Boolean(argValue)) ?? []
					);

					// merge existing and new arguments (provide by this invocation of `where`)
					const fieldArguments = Object.values({ ...currentFieldArguments, ...newFieldArguments }).filter(
						Boolean
					) as Argument<any, any>[];

					// add the new arguments to the `Field` selection
					if (fieldArguments.length > 0) {
						// return field(node.name.value, fieldArguments, node.selectionSet)
						return {
							...node,
							arguments: fieldArguments,
						};
					}
				},
				leave: () => {
					selectionPath.pop();
				},
			},
		});

		this.#rootSelection = visit(this.#rootSelection, visitor);
		this.#typeSelection = this.#rootSelection.selections.at(0)?.selectionSet;

		// @note needed to prevent TypeScript from entering infinite type inference recursion
		return this as any;
	};

	select: SelectMethod<Config> = (...paths) => {
		const segments = paths.map((path) => path.split('.'));

		// @todo retain provided (nested) arguments
		this.#typeSelection = toSelectionSet(segments);
		this.#rootSelection = selectionSet([
			field(
				this.config.rootField, 
				this.#rootSelection.selections[0]!.arguments,
				this.#typeSelection
			),
		]);

		// @note needed to prevent TypeScript from entering infinite type inference recursion
		return this as any;
	};

	on: OnMethod<Config> = (typename, builderCb) => {
		const type = this.config.schema.getType(typename);
		if (!isObjectType(type)) {
			// @question support interface types too?
			throw new Error(`Type "${typename}" must be an Object type.`);
		}

		const builder = builderCb(
			new FragmentDefinitionBuilder({
				schema: this.config.schema,
				type,
				// will be populated by `builderCb`
				selection: undefined as any, // @todo populate default selection
			})
		);
		const fragmentDefinition = builder.compile();
		this.#fragmentDefinitions.set(fragmentDefinition.name.value, fragmentDefinition);

		// collect variable definitions and values from the constructed fragment definition
		builder.variableDefinitions.forEach((fragmentVariableDef) => this.#variableDefinitions.add(fragmentVariableDef));
		builder.variableValues.forEach((variableValue, variableDef) =>
			this.#variableValues.set(variableDef, variableValue)
		);

		//
		// Add the `FragmentSpread` to the appropriate `Field's` selections
		//

		const rootType = this.config.schema.getRootType(this.config.rootType);
		const typeInfo = new TypeInfo(this.config.schema, rootType);

		const visitor = visitWithTypeInfo(typeInfo, {
			Field: (node) => {
				const fieldType = getNamedType(typeInfo.getType());

				if (isAbstractType(fieldType)) {
					// Ensure that the type selection is for a valid possible type
					const possibleTypes = this.config.schema.getPossibleTypes(fieldType).map(({ name }) => name);
					if (!possibleTypes.includes(typename)) {
						return;
					}

					return {
						...node,
						selectionSet: {
							...node.selectionSet,
							selections: [
								...node.selectionSet!.selections,

								// @note we use inline fragments to mimic what we are doing at compile time
								inlineFragment(fragmentDefinition.typeCondition, fragmentDefinition.selectionSet),

								// @todo spread a named fragment
								// {
								//  kind: Kind.FRAGMENT_SPREAD,
								//  name: { kind: Kind.NAME, value: fragmentDefinition.name.value }
								// }
							],
						},
					};
				}
			},
		});

		this.#rootSelection = visit(this.#rootSelection, visitor);
		this.#typeSelection = this.#rootSelection.selections.at(0)?.selectionSet;

		return this as any;
	};

	exec: ExecMethod<Config> = async () => {
		const result = await this.config.executor.execute(this.config.rootType, this.compile(), this.variables);

		if (result !== null && typeof (result as any)[Symbol.asyncIterator] === 'function') {
			// `Executor` implementations return `AsyncIterators` for subscription operations
			return from(result as any).pipe(
				map(nextResult => {
					return (nextResult as any)[this.config.rootField];
				})
			)
		} else if (result !== null && typeof result === 'object') {
			// extract the result from the root field
			// @todo freeze objects (to match `readonly` semantics defined by typings)
			return (result as any)[this.config.rootField];
		} else {
			throw new Error(`Executor failed to return valid result. Got "${JSON.stringify(result)}".`);
		}
	};

	// @todo return `graphql`'s TypedDocumentNode (to support integration with other tooling)
	compile() {
		return document([
			// @todo updated `tql` Operation AST type to allow `FragmentDefinition`'s
			// ...Array.from(this.#fragmentDefinitions.values()) as any,
			operation(this.config.rootType, '', this.#rootSelection, Array.from(this.#variableDefinitions.values())),
		]);
	}
}
