import {
	ASTNode,
	buildASTSchema,
	buildSchema,
	BuildSchemaOptions,
	DocumentNode,
	GraphQLSchema,
	Kind,
	ObjectTypeDefinitionNode,
	parse,
	ParseOptions,
	print,
	printSchema,
	visit,
} from 'graphql';
import { mergeSchemas } from '@graphql-tools/schema';
import {
	ConfigurationVariableKind,
	DataSourceKind,
	FieldConfiguration,
	TypeConfiguration,
} from '@wundergraph/protobuf';
import { Api, DataSource, StaticApiCustom } from './index';
import { WellKnownClaim, WellKnownClaimValues } from '../graphql/operations';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

export const mergeApis = <T extends {} = {}>(roles: string[], customClaims: string[], ...apis: Api<T>[]): Api<T> => {
	const dataSources: DataSource<T>[] = apis
		.map((api) => api.DataSources || [])
		.reduce((previousValue, currentValue) => [...previousValue, ...currentValue], []);

	const jsonScalars: string[] = [];
	apis.forEach((api) => {
		if (api.CustomJsonScalars) {
			jsonScalars.push(...api.CustomJsonScalars);
		}
	});

	const fields = mergeApiFields(apis);
	const types = mergeTypeConfigurations(apis);
	const schema = mergeApiSchemas(roles, customClaims, apis, dataSources, fields);
	const interpolateVariableDefinitionAsJSON = apis.flatMap((api) => api.interpolateVariableDefinitionAsJSON);
	return new Api(schema, '', dataSources, fields, types, interpolateVariableDefinitionAsJSON, jsonScalars);
};

const mergeApiFields = <T extends {} = {}>(apis: Api<T>[]): FieldConfiguration[] => {
	const fields: FieldConfiguration[] = [];
	apis
		.map((a) => a.Fields || [])
		.reduce((previousValue, currentValue) => [...previousValue, ...currentValue], [])
		.forEach((f) => {
			const existing = fields.find(
				(existing) => existing.typeName === f.typeName && existing.fieldName === f.fieldName
			);
			if (!existing) {
				fields.push(f);
				return;
			}
			if (f.requiresFields) {
				existing.requiresFields = [...new Set([...(existing.requiresFields || []), ...f.requiresFields])];
			}
			if (f.argumentsConfiguration) {
				existing.argumentsConfiguration = existing.argumentsConfiguration || [];
				f.argumentsConfiguration.forEach((a) => {
					const exists = existing.argumentsConfiguration!.find((e) => e.name === a.name) !== undefined;
					if (exists) {
						return;
					}
					existing.argumentsConfiguration!.push(a);
				});
			}
		});
	return fields;
};

const mergeTypeConfigurations = <T extends {} = {}>(apis: Api<T>[]): TypeConfiguration[] => {
	const out: TypeConfiguration[] = [];
	apis
		.map((api) => api.Types || [])
		.forEach((types) =>
			types.forEach((conf) => {
				const exists = out.find((existing) => existing.typeName === conf.typeName) !== undefined;
				if (exists) {
					return;
				}
				out.push(conf);
			})
		);
	return out;
};

export const baseSchema = `
"""
The @removeNullVariables directive allows you to remove variables with null value from your GraphQL Query or Mutation Operations.

A potential use-case could be that you have a graphql upstream which is not accepting null values for variables.
By enabling this directive all variables with null values will be removed from upstream query.

query ($say: String, $name: String) @removeNullVariables {
	hello(say: $say, name: $name)
}

Directive will transform variables json and remove top level null values.
{ "say": null, "name": "world" }

So upstream will receive the following variables:

{ "name": "world" }
"""
directive @removeNullVariables on QUERY | MUTATION

directive @hooksVariable on VARIABLE_DEFINITION

directive @jsonSchema (
  """
  The value of both of these keywords MUST be a string.

  Both of these keywords can be used to decorate a user interface with
  information about the data produced by this user interface.  A title
  will preferably be short, whereas a description will provide
  explanation about the purpose of the instance described by this
  schema.
  """
  title: String
  """
  The value of both of these keywords MUST be a string.

  Both of these keywords can be used to decorate a user interface with
  information about the data produced by this user interface.  A title
  will preferably be short, whereas a description will provide
  explanation about the purpose of the instance described by this
  schema.
  """
  description: String
  """
  The value of "multipleOf" MUST be a number, strictly greater than 0.

  A numeric instance is valid only if division by this keyword's value
  results in an integer.
  """
  multipleOf: Int
  """
  The value of "maximum" MUST be a number, representing an inclusive
  upper limit for a numeric instance.

  If the instance is a number, then this keyword validates only if the
  instance is less than or exactly equal to "maximum".
  """
  maximum: Int
  """
  The value of "exclusiveMaximum" MUST be number, representing an
  exclusive upper limit for a numeric instance.

  If the instance is a number, then the instance is valid only if it
  has a value strictly less than (not equal to) "exclusiveMaximum".
  """
  exclusiveMaximum: Int
  """
  The value of "minimum" MUST be a number, representing an inclusive
  lower limit for a numeric instance.

  If the instance is a number, then this keyword validates only if the
  instance is greater than or exactly equal to "minimum".
  """
  minimum: Int
  """
  The value of "exclusiveMinimum" MUST be number, representing an
  exclusive lower limit for a numeric instance.

  If the instance is a number, then the instance is valid only if it
  has a value strictly greater than (not equal to) "exclusiveMinimum".
  """
  exclusiveMinimum: Int
  """
  The value of this keyword MUST be a non-negative integer.

  A string instance is valid against this keyword if its length is less
  than, or equal to, the value of this keyword.

  The length of a string instance is defined as the number of its
  characters as defined by RFC 7159 [RFC7159].
  """
  maxLength: Int
  """
  The value of this keyword MUST be a non-negative integer.

  A string instance is valid against this keyword if its length is
  greater than, or equal to, the value of this keyword.

  The length of a string instance is defined as the number of its
  characters as defined by RFC 7159 [RFC7159].

  Omitting this keyword has the same behavior as a value of 0.
  """
  minLength: Int
  """
  The value of this keyword MUST be a string.  This string SHOULD be a
  valid regular expression, according to the ECMA 262 regular
  expression dialect.

  A string instance is considered valid if the regular expression
  matches the instance successfully.  Recall: regular expressions are
  not implicitly anchored.
  """
  pattern: String
  """
  The value of this keyword MUST be a non-negative integer.

  An array instance is valid against "maxItems" if its size is less
  than, or equal to, the value of this keyword.
  """
  maxItems: Int
  """
  The value of this keyword MUST be a non-negative integer.

  An array instance is valid against "minItems" if its size is greater
  than, or equal to, the value of this keyword.

  Omitting this keyword has the same behavior as a value of 0.
  """
  minItems: Int
  """
  The value of this keyword MUST be a boolean.

  If this keyword has boolean value false, the instance validates
  successfully.  If it has boolean value true, the instance validates
  successfully if all of its elements are unique.

  Omitting this keyword has the same behavior as a value of false.
  """
  uniqueItems: Boolean
  commonPattern: COMMON_REGEX_PATTERN

  """
  Optional field to apply the JSON schema to
  """
  on: String
) repeatable on VARIABLE_DEFINITION

enum COMMON_REGEX_PATTERN {
    EMAIL
    DOMAIN
}
`;

const roleSchema = (roles: string[]) => `
directive @rbac(
  "the user must match all roles"
  requireMatchAll: [WG_ROLE]
  "the user must match at least one of the roles"
  requireMatchAny: [WG_ROLE]
  "the user must not match all of the roles"
  denyMatchAll: [WG_ROLE]
  "the user must not match any of the roles"
  denyMatchAny: [WG_ROLE]
) on QUERY | MUTATION | SUBSCRIPTION

enum WG_ROLE {
    ${roles.join(' ')}
}
`;

const claimsSchema = (customClaims: string[]) => {
	const docs: Record<WellKnownClaim, string> = {
		ISSUER: 'iss',
		PROVIDER: 'deprecated alias for ISSUER',
		SUBJECT: 'sub',
		USERID: 'alias for sub',
		NAME: 'name',
		GIVEN_NAME: 'given_name',
		FAMILY_NAME: 'family_name',
		MIDDLE_NAME: 'middle_name',
		NICKNAME: 'nickname',
		PREFERRED_USERNAME: 'preferred_username',
		PROFILE: 'profile',
		PICTURE: 'picture',
		WEBSITE: 'website',
		EMAIL: 'email',
		EMAIL_VERIFIED: 'email_verified',
		GENDER: 'gender',
		BIRTH_DATE: 'birthdate',
		ZONE_INFO: 'zoneinfo',
		LOCALE: 'locale',
		LOCATION: 'location',
	};
	if (Object.keys(docs).length !== WellKnownClaimValues.length) {
		throw new Error('unhandled claims in claimsSchema()');
	}
	const wellKnownClaims = Object.entries(docs).map(([key, doc]) => `"""${doc}"""\n${key}`);
	return `
"""
The @fromClaim directive sets the variable to the value retrieved from the given a claim.
Adding this directive makes the operation require authentication.
"""

directive @fromClaim(
  name: WG_CLAIM,
  on: String = ""
) repeatable on VARIABLE_DEFINITION

"""
Well known claims - https://www.iana.org/assignments/jwt/jwt.xhtml
"""
enum WG_CLAIM {

	${customClaims.map((claim) => `"""custom"""\n${claim}`).join('\n')}
	${wellKnownClaims.join('\n')}
}
`;
};

const uuidSchema = `
"""
The directive @injectGeneratedUUID injects a generated UUID into the variable.
This variable MUST be a string.
At the same time, it removes the variable from the input definition,
disallowing the user to supply it.

This means, the UUID is 100% generated server-side and can be considered untempered.
"""
directive @injectGeneratedUUID(
	on: String = ""
) repeatable on VARIABLE_DEFINITION

`;

const injectEnvironmentVariableSchema = `
"""
The directive @injectEnvironmentVariable allows you to inject an environment variable into the variable definition.
"""
directive @injectEnvironmentVariable (
    name: String!,
	on: String = ""
) repeatable on VARIABLE_DEFINITION
`;

const dateTimeSchema = `
"""
The directive @injectCurrentDateTime injects a DateTime string of the current date and time into the variable.
This variable MUST be a string compatible scalar. 

The default format, is: ISO 8601
If no format is chosen, the default format is used.
Custom formats are allowed by specifying a format conforming to the Golang specification for specifying a date time format.
"""
directive @injectCurrentDateTime (
    format: WunderGraphDateTimeFormat = ISO8601
    """customFormat must conform to the Golang specification for specifying a date time format"""
    customFormat: String,
	on: String = ""
) repeatable on VARIABLE_DEFINITION

enum WunderGraphDateTimeFormat {
    "2006-01-02T15:04:05-0700"
    ISO8601
    "Mon Jan _2 15:04:05 2006"
    ANSIC
    "Mon Jan _2 15:04:05 MST 2006"
    UnixDate
    "Mon Jan 02 15:04:05 -0700 2006"
    RubyDate
    "02 Jan 06 15:04 MST"
    RFC822
    "02 Jan 06 15:04 -0700"
    RFC822Z
    "Monday, 02-Jan-06 15:04:05 MST"
    RFC850
    "Mon, 02 Jan 2006 15:04:05 MST"
    RFC1123
    "Mon, 02 Jan 2006 15:04:05 -0700"
    RFC1123Z
    "2006-01-02T15:04:05Z07:00"
    RFC3339
    "2006-01-02T15:04:05.999999999Z07:00"
    RFC3339Nano
    "3:04PM"
    Kitchen
    "Jan _2 15:04:05"
    Stamp
    "Jan _2 15:04:05.000"
    StampMilli
    "Jan _2 15:04:05.000000"
    StampMicro
    "Jan _2 15:04:05.000000000"
    StampNano
}
`;

const internalSchema = `
"""
The @internalOperation Directive marks an Operation as internal.
By doing so, the Operation is no longer accessible from the public API.
It can only be accessed by internal services, like hooks.
"""
directive @internalOperation on QUERY | MUTATION | SUBSCRIPTION 
`;

const exportSchema = `

"""
The @export directive instructs the Execution Planner to export the field during the execution into the variable of the 'as' argument.
As the execution is depth first, a field can only be used after it has been exported.
Additionally, a field can only be used after using the '_join' field or on a different data source.
It's not possible to export a field and use it in for the same data source.

Note that the @export directive only works on fields that return a single value.
It's not possible to export a list or object field.
"""
directive @export (
    """
    The argument 'as' is the name of the variable to export the field to.
    """
    as: String!
) on FIELD

"""
The directive @internal marks a variable definition as internal so that clients can't access it.
The field is also not visible in the public API.
It's only being used as an internal variable to export fields into.
"""
directive @internal on VARIABLE_DEFINITION
`;

const transformSchema = `
"""
The @transform directive allows to apply transformations to the response.
By applying the directive, the shape of the response can be altered,
which will also modify the JSON-Schema of the response.
That is, you will keep full type safety and code-generation for transformed fields.
"""
directive @transform(
    """
    Using the 'get' transformation allows you to extract a nested field using a JSON path.
    This is useful to unnest data, e.g. when using the '_join' field, which adds an extra layer of nesting.
    
    Example:
    
    query GetName {
        name: me @transform(get: "info.name") {
            info {
                name
            }
        }
    }
    
    Before the transformation, the resolve looks like this:
    
    {
        "name": {
            "info": {
                "name": "John Doe"
            }
        }
    }
    
    With the transformation applied, the response will be reshaped like this:
    
    {
        "name": "John Doe"
    }
    
    """
    get: String
) on FIELD
`;

const requireAuthenticationSchema = `
"""
The @requireAuthentication Directive marks an Operation to require authentication.
Without authentication, the operation will return an Unauthorized error with status code 401.
"""
directive @requireAuthentication on QUERY | MUTATION | SUBSCRIPTION 
`;

const mergeApiSchemas = <T extends {} = {}>(
	roles: string[],
	customClaims: string[],
	apis: Api<T>[],
	dataSources: DataSource[],
	fields: FieldConfiguration[]
): string => {
	const graphQLSchemas = apis
		.map((api, i) => {
			return api.Schema
				? buildSchema(api.Schema, {
						assumeValidSDL: true,
				  })
				: null;
		})
		.flatMap((schema) => (schema ? [schema] : []));

	graphQLSchemas.push(
		buildSchema(baseSchema, {
			assumeValidSDL: true,
		})
	);

	const options: BuildSchemaOptions & ParseOptions = {
		assumeValidSDL: true,
		assumeValid: true,
	};

	if (roles.length) {
		graphQLSchemas.push(buildSchema(roleSchema(roles), options));
	}
	graphQLSchemas.push(buildSchema(claimsSchema(customClaims), options));
	graphQLSchemas.push(buildSchema(dateTimeSchema, options));
	graphQLSchemas.push(buildSchema(uuidSchema, options));
	graphQLSchemas.push(buildSchema(internalSchema, options));
	graphQLSchemas.push(buildSchema(injectEnvironmentVariableSchema, options));
	graphQLSchemas.push(buildSchema(exportSchema, options));
	graphQLSchemas.push(buildSchema(transformSchema, options));
	graphQLSchemas.push(buildSchema(requireAuthenticationSchema, options));

	let mergedGraphQLSchema: GraphQLSchema;
	try {
		mergedGraphQLSchema = mergeSchemas({
			schemas: graphQLSchemas,
			...options,
		});
	} catch (e: any) {
		throw new Error(
			`Schemas could not be merged. Define namespaces on the APIs to avoid type collisions. Error: ${e.message}`
		);
	}

	const queryTypeName = mergedGraphQLSchema.getQueryType()?.name;
	const mutationTypeName = mergedGraphQLSchema.getMutationType()?.name;
	const subscriptionTypeName = mergedGraphQLSchema.getSubscriptionType()?.name;

	const hasQueryType = queryTypeName !== undefined;

	const rootTypeNames: string[] = [];
	if (queryTypeName) {
		rootTypeNames.push(queryTypeName);
	}
	if (mutationTypeName) {
		rootTypeNames.push(mutationTypeName);
	}
	if (subscriptionTypeName) {
		rootTypeNames.push(subscriptionTypeName);
	}

	const printed = printSchemaWithDirectives(mergedGraphQLSchema);

	const ast = parse(printed);
	const filtered = visit(ast, {
		ObjectTypeDefinition: (node) => {
			if (node.name.value.startsWith('__')) {
				return null;
			}
			switch (node.name.value) {
				case 'Entity':
					return null;
			}
			const hasJoinField = node.fields?.find((field) => field.name.value === '_join') !== undefined;
			const isRootType = rootTypeNames.includes(node.name.value);
			if (hasJoinField || isRootType || !hasQueryType) {
				return;
			}
			const custom: StaticApiCustom = {
				data: {
					kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
					staticVariableContent: '{}',
					placeholderVariableName: '',
					environmentVariableDefaultValue: '',
					environmentVariableName: '',
				},
			};
			dataSources.push({
				Kind: DataSourceKind.STATIC,
				RootNodes: [
					{
						typeName: node.name.value,
						fieldNames: ['_join'],
					},
				],
				Custom: custom,
				ChildNodes: [],
				Directives: [],
				RequestTimeoutSeconds: 0,
			});
			fields.push({
				typeName: node.name.value,
				fieldName: '_join',
				disableDefaultFieldMapping: true,
				path: ['_join'],
				requiresFields: [],
				argumentsConfiguration: [],
				unescapeResponseJson: false,
			});
			const updated: ObjectTypeDefinitionNode = {
				...node,
				fields: [
					...(node.fields || []),
					{
						kind: Kind.FIELD_DEFINITION,
						type: {
							kind: Kind.NON_NULL_TYPE,
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: queryTypeName,
								},
							},
						},
						name: {
							kind: Kind.NAME,
							value: '_join',
						},
					},
				],
			};
			return updated;
		},
		UnionTypeDefinition: (node) => {
			if (node.name.value.startsWith('__')) {
				return null;
			}
		},
		ScalarTypeDefinition: (node) => {
			if (node.name.value.startsWith('__')) {
				return null;
			}
		},
		FieldDefinition: (node) => {
			if (node.name.value.startsWith('__')) {
				return null;
			}
		},
		DirectiveDefinition: (node) => {
			switch (node.name.value) {
				case 'key':
				case 'extends':
				case 'external':
				case 'requires':
				case 'provides':
					return null;
			}
		},
	});
	const withoutEmptyDescription = removeEmptyDescriptions(filtered);
	return printSchemaWithDirectives(buildASTSchema(withoutEmptyDescription));
};

const removeEmptyDescriptions = (astNode: DocumentNode): DocumentNode => {
	return visit(astNode, {
		enter: (node) => {
			switch (node.kind) {
				case 'ObjectTypeDefinition':
				case 'ScalarTypeDefinition':
				case 'InterfaceTypeDefinition':
				case 'UnionTypeDefinition':
				case 'FieldDefinition':
					if (node.description && node.description.value === '') {
						return {
							...node,
							description: undefined,
						};
					}
			}
		},
	});
};

const wunderGraphDirectives = [
	'internalOperation',
	'injectEnvironmentVariable',
	'fromClaim',
	'hooksVariable',
	'jsonSchema',
	'rbac',
	'injectGeneratedUUID',
	'injectCurrentDateTime',
	'internalOperation',
	'export',
];

const wunderGraphEnums = ['Claim', 'COMMON_REGEX_PATTERN', 'WG_ROLE', 'WunderGraphDateTimeFormat'];

export const removeBaseSchema = (schema: string): string => {
	const document = parse(schema);
	const filtered = visit(document, {
		ObjectTypeDefinition: (node) => {
			const fields = node.fields?.filter((field) => field.name.value !== '_join');
			return {
				...node,
				fields,
			};
		},
		DirectiveDefinition: (node) => {
			if (wunderGraphDirectives.includes(node.name.value)) {
				return null;
			}
		},
		EnumTypeDefinition: (node) => {
			if (wunderGraphEnums.includes(node.name.value)) {
				return null;
			}
		},
	});
	return print(filtered);
};
