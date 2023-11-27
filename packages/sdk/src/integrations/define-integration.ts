import { HasRequiredKeys } from 'type-fest';
import { WunderGraphIntegration } from './types';

export const defineIntegration = <Options extends object>(
	integration: Options extends undefined
		? () => WunderGraphIntegration
		: HasRequiredKeys<Options> extends false
		? (options?: Options) => WunderGraphIntegration
		: (options: Options) => WunderGraphIntegration
) => {
	return integration;
};
