import { GraphQLOperation } from '../../../graphql/operations';

export const isNotInternal = (op: GraphQLOperation): boolean => !op.Internal;

export const hasInput = (op: GraphQLOperation): boolean =>
	op.VariablesSchema.properties !== undefined && Object.keys(op.VariablesSchema.properties).length !== 0;

export const hasInternalInput = (op: GraphQLOperation): boolean =>
	op.InternalVariablesSchema.properties !== undefined &&
	Object.keys(op.InternalVariablesSchema.properties).length !== 0;

export const hasInjectedInput = (op: GraphQLOperation): boolean =>
	op.InjectedVariablesSchema.properties !== undefined &&
	Object.keys(op.InjectedVariablesSchema.properties).length !== 0;
