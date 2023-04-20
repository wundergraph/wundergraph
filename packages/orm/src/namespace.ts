import { OperationCreator } from './operation-creator';

export interface Namespace<APIs extends Record<string, any>> {
	from<Namespace extends keyof APIs>(namespace: Namespace): OperationCreator<{ schema: APIs[Namespace] }>;
}
