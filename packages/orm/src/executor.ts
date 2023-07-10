import { type OperationTypeNode, type DocumentNode } from 'graphql';
import { ClientRequest } from './internal-types';

export interface Executor {
	execute<T>(
		operation: OperationTypeNode,
		document: DocumentNode,
		variables?: Record<string, unknown>,
		namespace?: string,
		clientRequest?: ClientRequest,
		extraHeaders?: Record<string, string>
	): Promise<T>;
}
