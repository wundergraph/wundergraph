import type { AsyncLocalStorage } from 'node:async_hooks';

export interface AsyncStore {
	ormOperationControllers: Array<AbortController>;
}

export type OperationsAsyncContext = AsyncLocalStorage<AsyncStore>;
