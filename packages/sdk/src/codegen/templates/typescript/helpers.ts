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
				liveQuery: !!op.LiveQuery?.enable,
				requiresAuthentication: op.AuthenticationConfig.required,
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
			requiresAuthentication: op.AuthenticationConfig.required,
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
				liveQuery: true,
				requiresAuthentication: op.AuthenticationConfig.required,
			};
		});

export const modelImports = (
	application: ResolvedApplication,
	includeInternal: boolean,
	includeResponseData?: boolean
): string => {
	return filteredOperations(application, includeInternal)
		.map((op) => {
			let out = `${op.Name}Response`;
			if (hasInput(op)) {
				out += `,${op.Name}Input`;
			}
			if (includeInternal && hasInternalInput(op)) {
				out += `,Internal${op.Name}Input`;
			}
			if (includeInternal && hasInjectedInput(op)) {
				out += `,Injected${op.Name}Input`;
			}
			if (includeResponseData === true) {
				out += `,${op.Name}ResponseData`;
			}
			return out;
		})
		.join(',');
};
