import type { GraphQLOperation } from '../../../graphql/operations';
import type { ResolvedApplication } from '../../../configure';
import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';

export const isNotInternal = (op: GraphQLOperation): boolean => !op.Internal;

export const hasInput = (op: GraphQLOperation): boolean =>
	op.VariablesSchema.properties !== undefined && Object.keys(op.VariablesSchema.properties).length !== 0;

export const hasInternalInput = (op: GraphQLOperation): boolean =>
	op.InternalVariablesSchema.properties !== undefined &&
	Object.keys(op.InternalVariablesSchema.properties).length !== 0;

export const hasInjectedInput = (op: GraphQLOperation): boolean =>
	op.InjectedVariablesSchema.properties !== undefined &&
	Object.keys(op.InjectedVariablesSchema.properties).length !== 0;

const filteredOperations = (application: ResolvedApplication, includeInternal: boolean) =>
	includeInternal ? application.Operations : application.Operations.filter((op) => !op.Internal);

export const filterNodeJSOperations = (application: ResolvedApplication): ResolvedApplication => {
	const copy = JSON.parse(JSON.stringify(application)) as ResolvedApplication;
	copy.Operations = copy.Operations.filter((op) => op.ExecutionEngine !== OperationExecutionEngine.ENGINE_NODEJS);
	return copy;
};

export const operations = (application: ResolvedApplication, operationType: OperationType, includeInternal: boolean) =>
	filteredOperations(application, includeInternal)
		.filter((op) => op.OperationType === operationType)
		.map((op) => {
			return {
				operationName: op.Name,
				operationPath: op.PathName,
				path: op.Name,
				hasInput: hasInput(op),
				hasInternalInput: hasInternalInput(op),
				injectedInputTypename: operationInjectedInputTypename(op),
				internalInputTypename: operationInternalInputTypename(op),
				liveQuery: !!op.LiveQuery?.enable,
				requiresAuthentication: op.AuthenticationConfig.required,
				responseDataTypename: operationResponseDataTypename(op),
				responseTypename: operationResponseTypename(op),
				isTypeScriptOperation: op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS,
			};
		});

export const queries = (application: ResolvedApplication, includeInternal: boolean) =>
	filteredOperations(application, includeInternal).map((op) => {
		return {
			operationName: op.Name,
			operationPath: op.PathName,
			path: op.Name,
			hasInput: hasInput(op),
			hasInternalInput: hasInternalInput(op),
			injectedInputTypename: operationInjectedInputTypename(op),
			internalInputTypename: operationInternalInputTypename(op),
			requiresAuthentication: op.AuthenticationConfig.required,
			responseDataTypename: operationResponseDataTypename(op),
			responseTypename: operationResponseTypename(op),
			liveQuery: !!op.LiveQuery?.enable,
		};
	});

export const liveQueries = (application: ResolvedApplication, includeInternal: boolean) =>
	filteredOperations(application, includeInternal)
		.filter((op) => op.OperationType === OperationType.QUERY && op.LiveQuery && op.LiveQuery.enable)
		.map((op) => {
			return {
				operationName: op.Name,
				operationPath: op.PathName,
				path: op.Name,
				hasInput: hasInput(op),
				hasInternalInput: hasInternalInput(op),
				injectedInputTypename: operationInjectedInputTypename(op),
				internalInputTypename: operationInternalInputTypename(op),
				liveQuery: true,
				requiresAuthentication: op.AuthenticationConfig.required,
				responseDataTypename: operationResponseDataTypename(op),
				responseTypename: operationResponseTypename(op),
			};
		});

export const operationInputTypename = (op: GraphQLOperation) => `${op.Name}Input`;
export const operationInternalInputTypename = (op: GraphQLOperation) => `${op.Name}InternalInput`;
export const operationInjectedInputTypename = (op: GraphQLOperation) => `${op.Name}InjectedInput`;
export const operationResponseTypename = (op: GraphQLOperation) => `${op.Name}Response`;
export const operationResponseDataTypename = (op: GraphQLOperation) => `${op.Name}ResponseData`;

export const modelImports = (
	application: ResolvedApplication,
	includeInternal: boolean,
	includeResponseData?: boolean
): string => {
	return filteredOperations(application, includeInternal)
		.map((op) => {
			let out = `${op.Name}Response`;
			if (hasInput(op)) {
				out += `,${operationInputTypename(op)}`;
			}
			if (includeInternal && hasInternalInput(op)) {
				out += `,${operationInternalInputTypename(op)}`;
			}
			if (includeInternal && hasInjectedInput(op)) {
				out += `,${operationInjectedInputTypename(op)}`;
			}
			if (includeResponseData === true) {
				out += `,${operationResponseDataTypename(op)}`;
			}
			return out;
		})
		.join(',');
};
