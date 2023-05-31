import { TelemetryOptions } from '@wundergraph/protobuf';
import { TracerConfig } from '../types';
import { resolveConfigurationVariable } from '../../configure/variables';

export const loadTraceConfigFromWgConfig = (config: TelemetryOptions): TracerConfig => {
	const enabled = config.enabled ? resolveConfigurationVariable(config.enabled) === 'true' : false;
	const authToken = config.authToken ? resolveConfigurationVariable(config.authToken) : '';
	const exporterHttpEndpoint = config.exporterHttpEndpoint
		? resolveConfigurationVariable(config.exporterHttpEndpoint)
		: '';

	return {
		enabled,
		authToken,
		httpEndpoint: exporterHttpEndpoint,
	};
};
