import { WgEnvironmentVariable, wgEnvironmentVariableToJSON } from '@wundergraph/protobuf';

export const WgEnvVariableName = (v: WgEnvironmentVariable): string => {
	const varName = wgEnvironmentVariableToJSON(v);

	if (varName === 'UNKNOWN') {
		throw new Error(`Unknown environment variable name: ${v}`);
	}

	return varName;
};

export const WgEnvValue = (v: WgEnvironmentVariable): string | undefined => {
	const varName = WgEnvVariableName(v);

	return process.env[varName];
};
