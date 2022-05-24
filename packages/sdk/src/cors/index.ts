import { ConfigurationVariableKind, CorsConfiguration } from '@wundergraph/protobuf';

const allowAll: CorsConfiguration = {
	allowCredentials: true,
	allowedHeaders: ['*'],
	allowedMethods: ['GET', 'POST'],
	allowedOrigins: [
		{
			kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
			staticVariableContent: '*',
			environmentVariableName: '',
			environmentVariableDefaultValue: '',
			placeholderVariableName: '',
		},
	],
	exposedHeaders: ['*'],
	maxAge: 120,
};

export default {
	allowAll,
};
