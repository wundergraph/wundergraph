import { EnvironmentVariable, InputVariable, PlaceHolder } from '../configure/variables';
import { ConfigurationVariable, ConfigurationVariableKind, HTTPHeader } from '@wundergraph/protobuf';

export interface HeaderConfiguration {
	// key is the name of the Header that will be sent to the upstream, e.g. Authorization
	key: string;
	// valueSource defines where the value should come from
	// static means, use the static content of the field "value"
	// clientRequest means, the content of "value" defines a client request Header field
	// so, if the field value is "Authorization",
	// the client Header value for the key "Authorization" will be injected into the header
	// env means, use the value from the environment variable
	valueSource: 'static' | 'env' | 'clientRequest' | 'placeholder';
	value: string;
	defaultValue?: string;
}

export interface IntrospectionHeadersBuilder {
	addStaticHeader: (key: string, value: InputVariable) => IntrospectionHeadersBuilder;
}

export interface IHeadersBuilder {
	addStaticHeader: (key: string, value: InputVariable) => IHeadersBuilder;
	addClientRequestHeader: (key: string, requestHeaderName: string) => IHeadersBuilder;
}

export class HeadersBuilder {
	private headers: HeaderConfiguration[] = [];

	public addStaticHeader = (key: string, value: InputVariable) => {
		if (value === undefined) {
			throw new Error(`Static header value cannot be undefined`);
		}
		if (typeof value === 'string') {
			this.headers.push({
				key,
				value,
				valueSource: 'static',
			});
			return this;
		}
		if ((value as PlaceHolder)._identifier === 'placeholder') {
			this.headers.push({
				key,
				value: (value as PlaceHolder).name,
				valueSource: 'placeholder',
			});
			return this;
		}
		this.headers.push({
			key,
			value: value.name,
			valueSource: 'env',
			defaultValue: (value as EnvironmentVariable).defaultValue,
		});
		return this;
	};
	public addClientRequestHeader = (key: string, requestHeaderName: string) => {
		this.headers.push({
			key,
			value: requestHeaderName,
			valueSource: 'clientRequest',
		});
		return this;
	};
	public build = (): HeaderConfiguration[] => {
		return this.headers;
	};
}

export const mapHeaders = (builder: HeadersBuilder): { [key: string]: HTTPHeader } => {
	const headers: { [key: string]: HTTPHeader } = {};

	builder.build().forEach((config: HeaderConfiguration) => {
		const values: ConfigurationVariable[] = [];
		switch (config.valueSource) {
			case 'placeholder':
				values.push({
					kind: ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE,
					staticVariableContent: '',
					environmentVariableDefaultValue: '',
					environmentVariableName: '',
					placeholderVariableName: config.value,
				});
				break;
			case 'clientRequest':
				values.push({
					kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
					staticVariableContent: `{{ .request.headers.${config.value} }}`,
					environmentVariableName: '',
					environmentVariableDefaultValue: '',
					placeholderVariableName: '',
				});
				break;
			case 'static':
				values.push({
					kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
					staticVariableContent: config.value,
					environmentVariableDefaultValue: '',
					environmentVariableName: '',
					placeholderVariableName: '',
				});
				break;
			case 'env':
				values.push({
					kind: ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE,
					staticVariableContent: '',
					environmentVariableDefaultValue: config.defaultValue || '',
					environmentVariableName: config.value,
					placeholderVariableName: '',
				});
				break;
		}
		headers[config.key] = {
			values,
		};
	});

	return headers;
};

export const resolveIntrospectionHeaders = (
	headers?: { [key: string]: HTTPHeader },
	extra?: Record<string, string>
): Record<string, string> => {
	const result = Object.assign({}, extra ?? {});
	if (headers !== undefined) {
		Object.keys(headers).forEach((key) => {
			if (headers[key].values.length === 1) {
				const kind = headers[key].values[0].kind;
				switch (kind) {
					case ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE:
						result[key] = headers[key].values[0].staticVariableContent;
						break;
					case ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE:
						if (process.env[headers[key].values[0].environmentVariableName] !== undefined) {
							result[key] = process.env[headers[key].values[0].environmentVariableName]!;
						} else if (headers[key].values[0].environmentVariableDefaultValue !== undefined) {
							result[key] = headers[key].values[0].environmentVariableDefaultValue;
						}
						break;
					default:
						throw new Error(`cannot resolve introspection header kind ${kind}`);
				}
			}
		});
	}

	return result;
};
