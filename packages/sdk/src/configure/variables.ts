import process from 'node:process';
import { ConfigurationVariable, ConfigurationVariableKind } from '@wundergraph/protobuf';
import { Logger } from '../logger';

export class EnvironmentVariable<DefaultValue = string> {
	constructor(name: string, defaultValue?: DefaultValue) {
		this.name = name;
		this.defaultValue = defaultValue;
	}

	public name: string;
	public defaultValue?: DefaultValue;
}

export class PlaceHolder {
	constructor(name: string) {
		this.name = name;
	}

	public name: string;
	public readonly _identifier = 'placeholder';
}

export type InputVariable<T = string> = T | EnvironmentVariable<T> | PlaceHolder;

/**
 * resolveVariable resolves a variable to a string. Whereby it can fetch the value from an environment variable,
 * or from a placeholder. This function should be rarely used, as "resolving" should be done in the gateway.
 */
export const resolveVariable = (variable: string | EnvironmentVariable): string => {
	if (variable === undefined) {
		throw new Error('could not resolve undefined data variable');
	}
	if (variable instanceof EnvironmentVariable) {
		const environmentVariable = variable as EnvironmentVariable;
		const resolved = process.env[environmentVariable.name];
		if (resolved !== undefined) {
			return resolved;
		}
		if (environmentVariable.defaultValue !== undefined) {
			return environmentVariable.defaultValue as string;
		}

		throw new Error(`could not resolve environment variable: ${environmentVariable.name}`);
	}
	return variable;
};

/**
 * resolveConfigurationVariable variable from config format to a string. Whereby it can fetch the value from an environment variable.
 * Throws an error if the variable is a placeholder.
 */
export const resolveConfigurationVariable = (variable: ConfigurationVariable): string => {
	switch (variable.kind) {
		case ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE:
			return variable.staticVariableContent;
		case ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE:
			return resolveVariable(
				new EnvironmentVariable(variable.environmentVariableName, variable.environmentVariableDefaultValue)
			);
		case ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE:
			throw `Placeholder ${variable.placeholderVariableName} should be replaced with a real value`;
	}
};

/**
 * mapInputVariable converts user InputVariable to a ConfigurationVariable stored in config.
 * Throws an error if the variable is undefined.
 */
export const mapInputVariable = (stringOrEnvironmentVariable: InputVariable) => {
	if (stringOrEnvironmentVariable === undefined) {
		Logger.error('unable to load environment variable');
		Logger.info('make sure to replace \'process.env...\' with new EnvironmentVariable("%VARIABLE_NAME%")');
		Logger.info('or ensure that all environment variables are defined\n');
		throw new Error('InputVariable is undefined');
	}
	if (typeof stringOrEnvironmentVariable === 'string') {
		const configVariable: ConfigurationVariable = {
			kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
			environmentVariableDefaultValue: '',
			environmentVariableName: '',
			placeholderVariableName: '',
			staticVariableContent: stringOrEnvironmentVariable,
		};
		return configVariable;
	}
	if ((stringOrEnvironmentVariable as PlaceHolder)._identifier === 'placeholder') {
		const variable: ConfigurationVariable = {
			kind: ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE,
			staticVariableContent: '',
			placeholderVariableName: (stringOrEnvironmentVariable as PlaceHolder).name,
			environmentVariableDefaultValue: '',
			environmentVariableName: '',
		};
		return variable;
	}
	const environmentVariable = stringOrEnvironmentVariable as EnvironmentVariable;
	const variable: ConfigurationVariable = {
		kind: ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE,
		staticVariableContent: '',
		placeholderVariableName: '',
		environmentVariableDefaultValue: environmentVariable.defaultValue || '',
		environmentVariableName: environmentVariable.name,
	};
	return variable;
};
