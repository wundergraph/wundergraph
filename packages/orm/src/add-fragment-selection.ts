import type { Field, FragmentDefinition, InlineFragment, NamedType, Selection, SelectionSet } from '@timkendall/tql';

// `Visit<Visitor extends ASTVisitor>`
// type MyVisitor = VisitWithTypeInfo<TypeInfo, { Field: }

export type AddFragment<
	Parent, // always a NamedType (i.e not a `WrappingType`)
	Selected extends SelectionSet<ReadonlyArray<Selection>>,
	Fragment extends FragmentDefinition<any, any, any>
> = Parent extends { __abstract: true }
	? SelectionSet<[...Selected['selections'], InlineFragment<Fragment['typeCondition'], Fragment['selectionSet']>]>
	: Selected;
