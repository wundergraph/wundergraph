import { WunderGraphHooksAndServerConfig } from '../server';
import { WellKnownClaim } from '../graphql/operations';
import { configureWunderGraphApplication } from '.';
import { runHookConfigGenerated, runHookConfigSetup } from '../integrations/hooks';
import { WunderGraphConfig } from '../integrations/types';

export const defineConfig = (config: WunderGraphConfig) => {
	return config;
};

export const createWunderGraphApplication = async <
	TCustomClaim extends string,
	TPublicClaim extends TCustomClaim | WellKnownClaim
>(
	config: WunderGraphConfig,
	server?: WunderGraphHooksAndServerConfig
) => {
	const appConfig = await runHookConfigSetup({ config });

	appConfig.server = server;

	configureWunderGraphApplication<TCustomClaim, TPublicClaim>(appConfig);

	await runHookConfigGenerated({
		config,
		appConfig,
	});
};
