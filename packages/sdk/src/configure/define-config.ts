import { WunderGraphHooksAndServerConfig } from '../server';
import { WellKnownClaim } from '../graphql/operations';
import { configureWunderGraphApplication } from '.';
import path from 'path';
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
	const applicationConfig = await runHookConfigSetup({ config });

	// applicationConfig.server = await resolveServerConfig();
	applicationConfig.server = server;

	configureWunderGraphApplication<TCustomClaim, TPublicClaim>(applicationConfig);

	await runHookConfigGenerated({
		config: applicationConfig,
	});
};

const resolveServerConfig = async () => {
	if (!process.env.WG_DIR_ABS) {
		return;
	}

	return (await import(path.resolve(process.env.WG_DIR_ABS, 'generated/bundle/server.cjs')))?.default as
		| WunderGraphHooksAndServerConfig
		| undefined;
};
