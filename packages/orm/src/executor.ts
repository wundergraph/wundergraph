import { type OperationTypeNode, type DocumentNode } from 'graphql';

export interface Executor {
	execute<T>(
		operation: OperationTypeNode,
		document: DocumentNode,
		variables?: Record<string, unknown>,
		namespace?: string,
		extraHeaders?: Record<string, string>
	): Promise<T>;
}
