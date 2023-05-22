import { WunderGraphHooksAndServerConfig } from '../server';
import { WellKnownClaim } from '../graphql/operations';
import { configureWunderGraphApplication } from '.';
import path from 'path';
import { runHookConfigGenerated, runHookConfigSetup } from '../integrations/hooks';
import { UserConfig } from '../integrations/types';
import { OperationsConfiguration } from './operations';

export const defineConfig = (config: UserConfig) => {
	// @todo we should export this and generate the configureWunderGraphApplication config
	// if wundergraph.config.ts has default export defineConfig
	createWunderGraphApplication(config);

	return config;
};

export const createWunderGraphApplication = async <
	TCustomClaim extends string,
	TPublicClaim extends TCustomClaim | WellKnownClaim
>(
	config: UserConfig
) => {
	const applicationConfig = await runHookConfigSetup({ config });

	// this doesn't work yet because we can't import TypeScript here.
	// applicationConfig.operations = await resolveOperationsConfig();
	// applicationConfig.server = await resolveServerConfig();

	configureWunderGraphApplication(applicationConfig);

	await runHookConfigGenerated({
		config: {
			...config,
			applicationConfig,
		},
	});
};

const resolveServerConfig = async () => {
	if (!process.env.WG_DIR_ABS) {
		return;
	}

	return (await import(path.resolve(process.env.WG_DIR_ABS, 'generated/bundle/server.cjs'))) as
		| WunderGraphHooksAndServerConfig
		| undefined;
};

const resolveOperationsConfig = async () => {
	if (!process.env.WG_DIR_ABS) {
		return;
	}

	return (await import(path.resolve(process.env.WG_DIR_ABS, 'generated/bundle/operations.cjs'))) as
		| OperationsConfiguration
		| undefined;
};
