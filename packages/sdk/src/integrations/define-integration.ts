import { WunderGraphIntegration } from './types';

export const defineIntegration = <Config>(integration: (config: Config) => WunderGraphIntegration) => {
	return integration;
};
