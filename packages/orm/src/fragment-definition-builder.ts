import type { Tuples, Strings, Call } from 'hotscript';
import {
	GraphQLSchema,
	GraphQLNamedOutputType,
	TypeInfo,
	visitWithTypeInfo,
	GraphQLArgument,
	visit,
	print,
} from 'graphql';
import { pathOr } from 'remeda';
import {
	namedType,
	NamedType as NamedTypeDef,
	fragmentDefinition,
	SelectionSet,
	FragmentDefinition,
	Field,
	argument,
	variableDefinition,
	variable,
	VariableDefinition,
	Argument,
} from '@timkendall/tql';

import { NamedType } from './definition';
import { ArgumentDefinitions, type AbstractTypesInSelection } from './selections';
import { Paths, ToSelectionSet, toSelectionSet } from './paths';

interface FragmentDefinitionBuilderConfig {
	schema: Record<string, any>;
	typename: string;
	type: Record<string, any>;
	selection: SelectionSet<any>;
}

type SelectMethod<Config extends FragmentDefinitionBuilderConfig> = <
	Selected extends Array<Paths<NamedType<Config['type']>>>
>(
	...paths: Selected
) => FragmentDefinitionBuilder<{
	schema: Config['schema'];
	typename: Config['typename'];
	type: Config['type'];
	selection: ToSelectionSet<Call<Tuples.Map<Strings.Split<'.'>>, Selected>>;
}>;

type WhereMethod<Config extends FragmentDefinitionBuilderConfig> = <
	T extends Exclude<ArgumentDefinitions<Config['schema'], Config['type'], Config['selection']>, undefined>
>(
	variables: T
) => FragmentDefinitionBuilder<{
	schema: Config['schema'];
	typename: Config['typename'];
	type: Config['type'];
	// @todo populate selection with arguments
	selection: Config['selection'];
}>;
export class FragmentDefinitionBuilder<Config extends FragmentDefinitionBuilderConfig> {
	selection!: Config['selection'];

	#variableCounter = -1;
	#variableDefinitions = new Set<VariableDefinition<any, any>>();
	#variableValues = new Map<VariableDefinition<any, any>, unknown>();

	constructor(
		public readonly config: {
			schema: GraphQLSchema;
			type: GraphQLNamedOutputType;
			selection: SelectionSet<any>;
		}
	) {
		this.selection = config.selection;
	}

	get variableDefinitions() {
		return this.#variableDefinitions;
	}

	get variableValues() {
		return this.#variableValues;
	}

	#defineVariable(argumentDefinition: GraphQLArgument, value: unknown) {
		// create a unqiue (but still readable) name for the variable
		const name = `${this.config.type.name}_${argumentDefinition.name}_${++this.#variableCounter}`;
		if (!argumentDefinition.astNode?.type) {
			throw new Error('Unable to determine argument type from schema.');
		}
		const definition = variableDefinition(variable(name), argumentDefinition.astNode.type);

		this.#variableDefinitions.add(definition);
		this.#variableValues.set(definition, value);

		return definition.variable;
	}

	select: SelectMethod<Config> = (...paths) => {
		const segments = paths.map((path) => path.split('.'));
		this.selection = toSelectionSet(segments);
		// @todo retain provided arguments
		return this as any;
	};

	where: WhereMethod<Config> = (variables) => {
		const typeInfo = new TypeInfo(this.config.schema, this.config.type);
		// keep track of the argument path (so that we can lookup the correct value in `variables`)
		const selectionPath: string[] = [];

		const visitor = visitWithTypeInfo(typeInfo, {
			Field: {
				enter: (node) => {
					const fieldDef = typeInfo.getFieldDef();

					selectionPath.push(node.name.value);

					const currentFieldArguments = Object.fromEntries(node.arguments?.map((arg) => [arg.name.value, arg]) ?? []);
					const newFieldArguments = Object.fromEntries(
						fieldDef?.args
							?.map((argDef) => {
								const argumentPath = [...selectionPath, argDef.name];
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

		this.selection = visit(this.selection, visitor);

		// @note needed to prevent TypeScript from entering infinite type inference recursion
		return this as any;
	};

	compile(): FragmentDefinition<
		`${Config['typename']}Fragment`,
		NamedTypeDef<Config['typename']>,
		Config['selection']
	> {
		const fragmentName = `${this.config.type.name}Fields`;
		if (!this.selection) {
			throw new Error(`Fragment definition "${fragmentName}" does not have a selection defined.`);
		}
		return fragmentDefinition(fragmentName, namedType(this.config.type.name), this.selection) as any;
	}
}
