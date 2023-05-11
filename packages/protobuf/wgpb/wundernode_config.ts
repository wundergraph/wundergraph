/* eslint-disable */

export const protobufPackage = "wgpb";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  ERROR = 2,
  WARNING = 3,
  PANIC = 4,
  FATAL = 5,
}

export function logLevelFromJSON(object: any): LogLevel {
  switch (object) {
    case 0:
    case "DEBUG":
      return LogLevel.DEBUG;
    case 1:
    case "INFO":
      return LogLevel.INFO;
    case 2:
    case "ERROR":
      return LogLevel.ERROR;
    case 3:
    case "WARNING":
      return LogLevel.WARNING;
    case 4:
    case "PANIC":
      return LogLevel.PANIC;
    case 5:
    case "FATAL":
      return LogLevel.FATAL;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum LogLevel");
  }
}

export function logLevelToJSON(object: LogLevel): string {
  switch (object) {
    case LogLevel.DEBUG:
      return "DEBUG";
    case LogLevel.INFO:
      return "INFO";
    case LogLevel.ERROR:
      return "ERROR";
    case LogLevel.WARNING:
      return "WARNING";
    case LogLevel.PANIC:
      return "PANIC";
    case LogLevel.FATAL:
      return "FATAL";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum LogLevel");
  }
}

export enum AuthProviderKind {
  AuthProviderGithub = 0,
  AuthProviderOIDC = 1,
  AuthProviderAuth0 = 2,
}

export function authProviderKindFromJSON(object: any): AuthProviderKind {
  switch (object) {
    case 0:
    case "AuthProviderGithub":
      return AuthProviderKind.AuthProviderGithub;
    case 1:
    case "AuthProviderOIDC":
      return AuthProviderKind.AuthProviderOIDC;
    case 2:
    case "AuthProviderAuth0":
      return AuthProviderKind.AuthProviderAuth0;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum AuthProviderKind");
  }
}

export function authProviderKindToJSON(object: AuthProviderKind): string {
  switch (object) {
    case AuthProviderKind.AuthProviderGithub:
      return "AuthProviderGithub";
    case AuthProviderKind.AuthProviderOIDC:
      return "AuthProviderOIDC";
    case AuthProviderKind.AuthProviderAuth0:
      return "AuthProviderAuth0";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum AuthProviderKind");
  }
}

export enum OperationExecutionEngine {
  ENGINE_GRAPHQL = 0,
  ENGINE_NODEJS = 1,
}

export function operationExecutionEngineFromJSON(object: any): OperationExecutionEngine {
  switch (object) {
    case 0:
    case "ENGINE_GRAPHQL":
      return OperationExecutionEngine.ENGINE_GRAPHQL;
    case 1:
    case "ENGINE_NODEJS":
      return OperationExecutionEngine.ENGINE_NODEJS;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum OperationExecutionEngine");
  }
}

export function operationExecutionEngineToJSON(object: OperationExecutionEngine): string {
  switch (object) {
    case OperationExecutionEngine.ENGINE_GRAPHQL:
      return "ENGINE_GRAPHQL";
    case OperationExecutionEngine.ENGINE_NODEJS:
      return "ENGINE_NODEJS";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum OperationExecutionEngine");
  }
}

export enum PostResolveTransformationKind {
  GET_POST_RESOLVE_TRANSFORMATION = 0,
}

export function postResolveTransformationKindFromJSON(object: any): PostResolveTransformationKind {
  switch (object) {
    case 0:
    case "GET_POST_RESOLVE_TRANSFORMATION":
      return PostResolveTransformationKind.GET_POST_RESOLVE_TRANSFORMATION;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum PostResolveTransformationKind");
  }
}

export function postResolveTransformationKindToJSON(object: PostResolveTransformationKind): string {
  switch (object) {
    case PostResolveTransformationKind.GET_POST_RESOLVE_TRANSFORMATION:
      return "GET_POST_RESOLVE_TRANSFORMATION";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum PostResolveTransformationKind");
  }
}

export enum InjectVariableKind {
  UUID = 0,
  DATE_TIME = 1,
  ENVIRONMENT_VARIABLE = 2,
}

export function injectVariableKindFromJSON(object: any): InjectVariableKind {
  switch (object) {
    case 0:
    case "UUID":
      return InjectVariableKind.UUID;
    case 1:
    case "DATE_TIME":
      return InjectVariableKind.DATE_TIME;
    case 2:
    case "ENVIRONMENT_VARIABLE":
      return InjectVariableKind.ENVIRONMENT_VARIABLE;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum InjectVariableKind");
  }
}

export function injectVariableKindToJSON(object: InjectVariableKind): string {
  switch (object) {
    case InjectVariableKind.UUID:
      return "UUID";
    case InjectVariableKind.DATE_TIME:
      return "DATE_TIME";
    case InjectVariableKind.ENVIRONMENT_VARIABLE:
      return "ENVIRONMENT_VARIABLE";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum InjectVariableKind");
  }
}

export enum ClaimType {
  /** ISSUER - iss */
  ISSUER = 0,
  /** PROVIDER - alias for iss, deprecated */
  PROVIDER = 0,
  /** SUBJECT - sub */
  SUBJECT = 1,
  /** USERID - alias for sub */
  USERID = 1,
  /** NAME - name */
  NAME = 2,
  /** GIVEN_NAME - given_name */
  GIVEN_NAME = 3,
  /** FAMILY_NAME - family_name */
  FAMILY_NAME = 4,
  /** MIDDLE_NAME - middle_name */
  MIDDLE_NAME = 5,
  /** NICKNAME - nickname */
  NICKNAME = 6,
  /** PREFERRED_USERNAME - preferred_username */
  PREFERRED_USERNAME = 7,
  /** PROFILE - profile */
  PROFILE = 8,
  /** PICTURE - picture */
  PICTURE = 9,
  /** WEBSITE - website */
  WEBSITE = 10,
  /** EMAIL - email */
  EMAIL = 11,
  /** EMAIL_VERIFIED - email_verified */
  EMAIL_VERIFIED = 12,
  /** GENDER - gender */
  GENDER = 13,
  /** BIRTH_DATE - birthdate */
  BIRTH_DATE = 14,
  /** ZONE_INFO - zoneinfo */
  ZONE_INFO = 15,
  /** LOCALE - locale */
  LOCALE = 16,
  /** LOCATION - location */
  LOCATION = 17,
  CUSTOM = 999,
}

export function claimTypeFromJSON(object: any): ClaimType {
  switch (object) {
    case 0:
    case "ISSUER":
      return ClaimType.ISSUER;
    case 0:
    case "PROVIDER":
      return ClaimType.PROVIDER;
    case 1:
    case "SUBJECT":
      return ClaimType.SUBJECT;
    case 1:
    case "USERID":
      return ClaimType.USERID;
    case 2:
    case "NAME":
      return ClaimType.NAME;
    case 3:
    case "GIVEN_NAME":
      return ClaimType.GIVEN_NAME;
    case 4:
    case "FAMILY_NAME":
      return ClaimType.FAMILY_NAME;
    case 5:
    case "MIDDLE_NAME":
      return ClaimType.MIDDLE_NAME;
    case 6:
    case "NICKNAME":
      return ClaimType.NICKNAME;
    case 7:
    case "PREFERRED_USERNAME":
      return ClaimType.PREFERRED_USERNAME;
    case 8:
    case "PROFILE":
      return ClaimType.PROFILE;
    case 9:
    case "PICTURE":
      return ClaimType.PICTURE;
    case 10:
    case "WEBSITE":
      return ClaimType.WEBSITE;
    case 11:
    case "EMAIL":
      return ClaimType.EMAIL;
    case 12:
    case "EMAIL_VERIFIED":
      return ClaimType.EMAIL_VERIFIED;
    case 13:
    case "GENDER":
      return ClaimType.GENDER;
    case 14:
    case "BIRTH_DATE":
      return ClaimType.BIRTH_DATE;
    case 15:
    case "ZONE_INFO":
      return ClaimType.ZONE_INFO;
    case 16:
    case "LOCALE":
      return ClaimType.LOCALE;
    case 17:
    case "LOCATION":
      return ClaimType.LOCATION;
    case 999:
    case "CUSTOM":
      return ClaimType.CUSTOM;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ClaimType");
  }
}

export function claimTypeToJSON(object: ClaimType): string {
  switch (object) {
    case ClaimType.ISSUER:
      return "ISSUER";
    case ClaimType.PROVIDER:
      return "PROVIDER";
    case ClaimType.SUBJECT:
      return "SUBJECT";
    case ClaimType.USERID:
      return "USERID";
    case ClaimType.NAME:
      return "NAME";
    case ClaimType.GIVEN_NAME:
      return "GIVEN_NAME";
    case ClaimType.FAMILY_NAME:
      return "FAMILY_NAME";
    case ClaimType.MIDDLE_NAME:
      return "MIDDLE_NAME";
    case ClaimType.NICKNAME:
      return "NICKNAME";
    case ClaimType.PREFERRED_USERNAME:
      return "PREFERRED_USERNAME";
    case ClaimType.PROFILE:
      return "PROFILE";
    case ClaimType.PICTURE:
      return "PICTURE";
    case ClaimType.WEBSITE:
      return "WEBSITE";
    case ClaimType.EMAIL:
      return "EMAIL";
    case ClaimType.EMAIL_VERIFIED:
      return "EMAIL_VERIFIED";
    case ClaimType.GENDER:
      return "GENDER";
    case ClaimType.BIRTH_DATE:
      return "BIRTH_DATE";
    case ClaimType.ZONE_INFO:
      return "ZONE_INFO";
    case ClaimType.LOCALE:
      return "LOCALE";
    case ClaimType.LOCATION:
      return "LOCATION";
    case ClaimType.CUSTOM:
      return "CUSTOM";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ClaimType");
  }
}

export enum ValueType {
  STRING = 0,
  INT = 1,
  FLOAT = 2,
  BOOLEAN = 3,
  ANY = 4,
}

export function valueTypeFromJSON(object: any): ValueType {
  switch (object) {
    case 0:
    case "STRING":
      return ValueType.STRING;
    case 1:
    case "INT":
      return ValueType.INT;
    case 2:
    case "FLOAT":
      return ValueType.FLOAT;
    case 3:
    case "BOOLEAN":
      return ValueType.BOOLEAN;
    case 4:
    case "ANY":
      return ValueType.ANY;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ValueType");
  }
}

export function valueTypeToJSON(object: ValueType): string {
  switch (object) {
    case ValueType.STRING:
      return "STRING";
    case ValueType.INT:
      return "INT";
    case ValueType.FLOAT:
      return "FLOAT";
    case ValueType.BOOLEAN:
      return "BOOLEAN";
    case ValueType.ANY:
      return "ANY";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ValueType");
  }
}

export enum OperationType {
  QUERY = 0,
  MUTATION = 1,
  SUBSCRIPTION = 2,
}

export function operationTypeFromJSON(object: any): OperationType {
  switch (object) {
    case 0:
    case "QUERY":
      return OperationType.QUERY;
    case 1:
    case "MUTATION":
      return OperationType.MUTATION;
    case 2:
    case "SUBSCRIPTION":
      return OperationType.SUBSCRIPTION;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum OperationType");
  }
}

export function operationTypeToJSON(object: OperationType): string {
  switch (object) {
    case OperationType.QUERY:
      return "QUERY";
    case OperationType.MUTATION:
      return "MUTATION";
    case OperationType.SUBSCRIPTION:
      return "SUBSCRIPTION";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum OperationType");
  }
}

export enum DataSourceKind {
  STATIC = 0,
  REST = 1,
  GRAPHQL = 2,
  POSTGRESQL = 3,
  MYSQL = 4,
  SQLSERVER = 5,
  MONGODB = 6,
  SQLITE = 7,
  PRISMA = 8,
}

export function dataSourceKindFromJSON(object: any): DataSourceKind {
  switch (object) {
    case 0:
    case "STATIC":
      return DataSourceKind.STATIC;
    case 1:
    case "REST":
      return DataSourceKind.REST;
    case 2:
    case "GRAPHQL":
      return DataSourceKind.GRAPHQL;
    case 3:
    case "POSTGRESQL":
      return DataSourceKind.POSTGRESQL;
    case 4:
    case "MYSQL":
      return DataSourceKind.MYSQL;
    case 5:
    case "SQLSERVER":
      return DataSourceKind.SQLSERVER;
    case 6:
    case "MONGODB":
      return DataSourceKind.MONGODB;
    case 7:
    case "SQLITE":
      return DataSourceKind.SQLITE;
    case 8:
    case "PRISMA":
      return DataSourceKind.PRISMA;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum DataSourceKind");
  }
}

export function dataSourceKindToJSON(object: DataSourceKind): string {
  switch (object) {
    case DataSourceKind.STATIC:
      return "STATIC";
    case DataSourceKind.REST:
      return "REST";
    case DataSourceKind.GRAPHQL:
      return "GRAPHQL";
    case DataSourceKind.POSTGRESQL:
      return "POSTGRESQL";
    case DataSourceKind.MYSQL:
      return "MYSQL";
    case DataSourceKind.SQLSERVER:
      return "SQLSERVER";
    case DataSourceKind.MONGODB:
      return "MONGODB";
    case DataSourceKind.SQLITE:
      return "SQLITE";
    case DataSourceKind.PRISMA:
      return "PRISMA";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum DataSourceKind");
  }
}

export enum UpstreamAuthenticationKind {
  UpstreamAuthenticationJWT = 0,
  UpstreamAuthenticationJWTWithAccessTokenExchange = 1,
}

export function upstreamAuthenticationKindFromJSON(object: any): UpstreamAuthenticationKind {
  switch (object) {
    case 0:
    case "UpstreamAuthenticationJWT":
      return UpstreamAuthenticationKind.UpstreamAuthenticationJWT;
    case 1:
    case "UpstreamAuthenticationJWTWithAccessTokenExchange":
      return UpstreamAuthenticationKind.UpstreamAuthenticationJWTWithAccessTokenExchange;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum UpstreamAuthenticationKind");
  }
}

export function upstreamAuthenticationKindToJSON(object: UpstreamAuthenticationKind): string {
  switch (object) {
    case UpstreamAuthenticationKind.UpstreamAuthenticationJWT:
      return "UpstreamAuthenticationJWT";
    case UpstreamAuthenticationKind.UpstreamAuthenticationJWTWithAccessTokenExchange:
      return "UpstreamAuthenticationJWTWithAccessTokenExchange";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum UpstreamAuthenticationKind");
  }
}

export enum SigningMethod {
  SigningMethodHS256 = 0,
}

export function signingMethodFromJSON(object: any): SigningMethod {
  switch (object) {
    case 0:
    case "SigningMethodHS256":
      return SigningMethod.SigningMethodHS256;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum SigningMethod");
  }
}

export function signingMethodToJSON(object: SigningMethod): string {
  switch (object) {
    case SigningMethod.SigningMethodHS256:
      return "SigningMethodHS256";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum SigningMethod");
  }
}

export enum HTTPMethod {
  GET = 0,
  POST = 1,
  PUT = 2,
  DELETE = 3,
  OPTIONS = 4,
}

export function hTTPMethodFromJSON(object: any): HTTPMethod {
  switch (object) {
    case 0:
    case "GET":
      return HTTPMethod.GET;
    case 1:
    case "POST":
      return HTTPMethod.POST;
    case 2:
    case "PUT":
      return HTTPMethod.PUT;
    case 3:
    case "DELETE":
      return HTTPMethod.DELETE;
    case 4:
    case "OPTIONS":
      return HTTPMethod.OPTIONS;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum HTTPMethod");
  }
}

export function hTTPMethodToJSON(object: HTTPMethod): string {
  switch (object) {
    case HTTPMethod.GET:
      return "GET";
    case HTTPMethod.POST:
      return "POST";
    case HTTPMethod.PUT:
      return "PUT";
    case HTTPMethod.DELETE:
      return "DELETE";
    case HTTPMethod.OPTIONS:
      return "OPTIONS";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum HTTPMethod");
  }
}

export enum ArgumentSource {
  OBJECT_FIELD = 0,
  FIELD_ARGUMENT = 1,
}

export function argumentSourceFromJSON(object: any): ArgumentSource {
  switch (object) {
    case 0:
    case "OBJECT_FIELD":
      return ArgumentSource.OBJECT_FIELD;
    case 1:
    case "FIELD_ARGUMENT":
      return ArgumentSource.FIELD_ARGUMENT;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ArgumentSource");
  }
}

export function argumentSourceToJSON(object: ArgumentSource): string {
  switch (object) {
    case ArgumentSource.OBJECT_FIELD:
      return "OBJECT_FIELD";
    case ArgumentSource.FIELD_ARGUMENT:
      return "FIELD_ARGUMENT";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ArgumentSource");
  }
}

export enum ArgumentRenderConfiguration {
  RENDER_ARGUMENT_DEFAULT = 0,
  RENDER_ARGUMENT_AS_GRAPHQL_VALUE = 1,
  RENDER_ARGUMENT_AS_ARRAY_CSV = 2,
}

export function argumentRenderConfigurationFromJSON(object: any): ArgumentRenderConfiguration {
  switch (object) {
    case 0:
    case "RENDER_ARGUMENT_DEFAULT":
      return ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT;
    case 1:
    case "RENDER_ARGUMENT_AS_GRAPHQL_VALUE":
      return ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_GRAPHQL_VALUE;
    case 2:
    case "RENDER_ARGUMENT_AS_ARRAY_CSV":
      return ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_ARRAY_CSV;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ArgumentRenderConfiguration");
  }
}

export function argumentRenderConfigurationToJSON(object: ArgumentRenderConfiguration): string {
  switch (object) {
    case ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT:
      return "RENDER_ARGUMENT_DEFAULT";
    case ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_GRAPHQL_VALUE:
      return "RENDER_ARGUMENT_AS_GRAPHQL_VALUE";
    case ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_ARRAY_CSV:
      return "RENDER_ARGUMENT_AS_ARRAY_CSV";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ArgumentRenderConfiguration");
  }
}

export enum WebhookVerifierKind {
  HMAC_SHA256 = 0,
}

export function webhookVerifierKindFromJSON(object: any): WebhookVerifierKind {
  switch (object) {
    case 0:
    case "HMAC_SHA256":
      return WebhookVerifierKind.HMAC_SHA256;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum WebhookVerifierKind");
  }
}

export function webhookVerifierKindToJSON(object: WebhookVerifierKind): string {
  switch (object) {
    case WebhookVerifierKind.HMAC_SHA256:
      return "HMAC_SHA256";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum WebhookVerifierKind");
  }
}

export enum ConfigurationVariableKind {
  STATIC_CONFIGURATION_VARIABLE = 0,
  ENV_CONFIGURATION_VARIABLE = 1,
  PLACEHOLDER_CONFIGURATION_VARIABLE = 2,
}

export function configurationVariableKindFromJSON(object: any): ConfigurationVariableKind {
  switch (object) {
    case 0:
    case "STATIC_CONFIGURATION_VARIABLE":
      return ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE;
    case 1:
    case "ENV_CONFIGURATION_VARIABLE":
      return ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE;
    case 2:
    case "PLACEHOLDER_CONFIGURATION_VARIABLE":
      return ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ConfigurationVariableKind");
  }
}

export function configurationVariableKindToJSON(object: ConfigurationVariableKind): string {
  switch (object) {
    case ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE:
      return "STATIC_CONFIGURATION_VARIABLE";
    case ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE:
      return "ENV_CONFIGURATION_VARIABLE";
    case ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE:
      return "PLACEHOLDER_CONFIGURATION_VARIABLE";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ConfigurationVariableKind");
  }
}

export interface ApiAuthenticationConfig {
  cookieBased: CookieBasedAuthentication | undefined;
  hooks: ApiAuthenticationHooks | undefined;
  jwksBased: JwksBasedAuthentication | undefined;
  publicClaims: string[];
}

export interface JwksBasedAuthentication {
  providers: JwksAuthProvider[];
}

export interface JwksAuthProvider {
  jwksUrl: ConfigurationVariable | undefined;
  jwksJson: ConfigurationVariable | undefined;
  userInfoEndpoint: ConfigurationVariable | undefined;
  userInfoCacheTtlSeconds: number;
}

export interface ApiAuthenticationHooks {
  postAuthentication: boolean;
  mutatingPostAuthentication: boolean;
  revalidateAuthentication: boolean;
  postLogout: boolean;
}

export interface CookieBasedAuthentication {
  providers: AuthProvider[];
  authorizedRedirectUris: ConfigurationVariable[];
  authorizedRedirectUriRegexes: ConfigurationVariable[];
  hashKey: ConfigurationVariable | undefined;
  blockKey: ConfigurationVariable | undefined;
  csrfSecret: ConfigurationVariable | undefined;
}

export interface AuthProvider {
  id: string;
  kind: AuthProviderKind;
  githubConfig: GithubAuthProviderConfig | undefined;
  oidcConfig: OpenIDConnectAuthProviderConfig | undefined;
}

export interface GithubAuthProviderConfig {
  clientId: ConfigurationVariable | undefined;
  clientSecret: ConfigurationVariable | undefined;
}

export interface OpenIDConnectQueryParameter {
  name: ConfigurationVariable | undefined;
  value: ConfigurationVariable | undefined;
}

export interface OpenIDConnectAuthProviderConfig {
  issuer: ConfigurationVariable | undefined;
  clientId: ConfigurationVariable | undefined;
  clientSecret: ConfigurationVariable | undefined;
  queryParameters: OpenIDConnectQueryParameter[];
}

export interface Operation {
  name: string;
  content: string;
  operationType: OperationType;
  variablesSchema: string;
  responseSchema: string;
  cacheConfig: OperationCacheConfig | undefined;
  authenticationConfig: OperationAuthenticationConfig | undefined;
  liveQueryConfig: OperationLiveQueryConfig | undefined;
  authorizationConfig: OperationAuthorizationConfig | undefined;
  hooksConfiguration: OperationHooksConfiguration | undefined;
  variablesConfiguration:
    | OperationVariablesConfiguration
    | undefined;
  /**
   * internal operations are only accessible internally, e.g. to hooks
   * they cannot be reached from the public surface of the API
   */
  internal: boolean;
  interpolationVariablesSchema: string;
  postResolveTransformations: PostResolveTransformation[];
  engine: OperationExecutionEngine;
  path: string;
}

export interface PostResolveTransformation {
  kind: PostResolveTransformationKind;
  depth: number;
  get: PostResolveGetTransformation | undefined;
}

export interface PostResolveGetTransformation {
  from: string[];
  to: string[];
}

export interface OperationVariablesConfiguration {
  injectVariables: VariableInjectionConfiguration[];
}

export interface VariableInjectionConfiguration {
  variablePathComponents: string[];
  variableKind: InjectVariableKind;
  dateFormat: string;
  environmentVariableName: string;
}

export interface GraphQLDataSourceHooksConfiguration {
  onWSTransportConnectionInit: boolean;
}

export interface OperationHooksConfiguration {
  preResolve: boolean;
  postResolve: boolean;
  mutatingPreResolve: boolean;
  mutatingPostResolve: boolean;
  mockResolve: MockResolveHookConfiguration | undefined;
  httpTransportOnRequest: boolean;
  httpTransportOnResponse: boolean;
  customResolve: boolean;
}

export interface MockResolveHookConfiguration {
  enable: boolean;
  subscriptionPollingIntervalMillis: number;
}

export interface OperationAuthorizationConfig {
  claims: ClaimConfig[];
  roleConfig: OperationRoleConfig | undefined;
}

export interface OperationRoleConfig {
  /** the user must match all roles */
  requireMatchAll: string[];
  /** the user must match at least one of the roles */
  requireMatchAny: string[];
  /** the user must not match all of the roles */
  denyMatchAll: string[];
  /** the user must not match any of the roles */
  denyMatchAny: string[];
}

export interface CustomClaim {
  name: string;
  jsonPathComponents: string[];
  type: ValueType;
  required: boolean;
}

export interface ClaimConfig {
  variablePathComponents: string[];
  claimType: ClaimType;
  /** Available iff claimType == CUSTOM */
  custom?: CustomClaim | undefined;
}

export interface OperationLiveQueryConfig {
  enable: boolean;
  pollingIntervalSeconds: number;
}

export interface OperationAuthenticationConfig {
  authRequired: boolean;
}

export interface OperationCacheConfig {
  enable: boolean;
  maxAge: number;
  public: boolean;
  staleWhileRevalidate: number;
}

export interface EngineConfiguration {
  defaultFlushInterval: number;
  datasourceConfigurations: DataSourceConfiguration[];
  fieldConfigurations: FieldConfiguration[];
  graphqlSchema: string;
  typeConfigurations: TypeConfiguration[];
}

export interface DataSourceConfiguration {
  kind: DataSourceKind;
  rootNodes: TypeField[];
  childNodes: TypeField[];
  overrideFieldPathFromAlias: boolean;
  customRest: DataSourceCustomREST | undefined;
  customGraphql: DataSourceCustomGraphQL | undefined;
  customStatic: DataSourceCustomStatic | undefined;
  customDatabase: DataSourceCustomDatabase | undefined;
  directives: DirectiveConfiguration[];
  requestTimeoutSeconds: number;
  id: string;
}

export interface DirectiveConfiguration {
  directiveName: string;
  renameTo: string;
}

export interface DataSourceCustomREST {
  fetch: FetchConfiguration | undefined;
  subscription: RESTSubscriptionConfiguration | undefined;
  statusCodeTypeMappings: StatusCodeTypeMapping[];
  defaultTypeName: string;
}

export interface StatusCodeTypeMapping {
  statusCode: number;
  typeName: string;
  injectStatusCodeIntoBody: boolean;
}

export interface DataSourceCustomGraphQL {
  fetch: FetchConfiguration | undefined;
  subscription: GraphQLSubscriptionConfiguration | undefined;
  federation: GraphQLFederationConfiguration | undefined;
  upstreamSchema: string;
  hooksConfiguration: GraphQLDataSourceHooksConfiguration | undefined;
  customScalarTypeFields: SingleTypeField[];
}

export interface DataSourceCustomDatabase {
  databaseURL: ConfigurationVariable | undefined;
  prismaSchema: string;
  graphqlSchema: string;
  /** closeTimeoutSeconds define that the database connection will be closed after the given amount of seconds of inactivity */
  closeTimeoutSeconds: number;
  jsonTypeFields: SingleTypeField[];
  jsonInputVariables: string[];
}

export interface GraphQLFederationConfiguration {
  enabled: boolean;
  serviceSdl: string;
}

export interface DataSourceCustomStatic {
  data: ConfigurationVariable | undefined;
}

export interface GraphQLSubscriptionConfiguration {
  enabled: boolean;
  url: ConfigurationVariable | undefined;
  useSSE: boolean;
}

export interface FetchConfiguration {
  /**
   * You should either configure url OR a combination of baseURL and path
   * If url resolves to a non empty string, it takes precedence over baseURL and path
   * If url resolves to an empty string, the url will be configured as "{{baseURL}}{{path}}"
   */
  url: ConfigurationVariable | undefined;
  method: HTTPMethod;
  header: { [key: string]: HTTPHeader };
  body: ConfigurationVariable | undefined;
  query: URLQueryConfiguration[];
  upstreamAuthentication:
    | UpstreamAuthentication
    | undefined;
  /**
   * urlEncodeBody defines whether the body should be URL encoded or not
   * by default, the body will be JSON encoded
   * setting urlEncodeBody to true will render the body empty,
   * the Header Content-Type will be set to application/x-www-form-urlencoded,
   * and the body will be URL encoded and set as the URL Query String
   */
  urlEncodeBody: boolean;
  mTLS: MTLSConfiguration | undefined;
  baseUrl: ConfigurationVariable | undefined;
  path: ConfigurationVariable | undefined;
  httpProxyUrl?: ConfigurationVariable | undefined;
}

export interface FetchConfiguration_HeaderEntry {
  key: string;
  value: HTTPHeader | undefined;
}

export interface MTLSConfiguration {
  key: ConfigurationVariable | undefined;
  cert: ConfigurationVariable | undefined;
  insecureSkipVerify: boolean;
}

export interface UpstreamAuthentication {
  kind: UpstreamAuthenticationKind;
  jwtConfig: JwtUpstreamAuthenticationConfig | undefined;
  jwtWithAccessTokenExchangeConfig: JwtUpstreamAuthenticationWithAccessTokenExchange | undefined;
}

export interface JwtUpstreamAuthenticationConfig {
  secret: ConfigurationVariable | undefined;
  signingMethod: SigningMethod;
}

export interface JwtUpstreamAuthenticationWithAccessTokenExchange {
  secret: ConfigurationVariable | undefined;
  signingMethod: SigningMethod;
  accessTokenExchangeEndpoint: ConfigurationVariable | undefined;
}

export interface RESTSubscriptionConfiguration {
  enabled: boolean;
  pollingIntervalMillis: number;
  skipPublishSameResponse: boolean;
}

export interface URLQueryConfiguration {
  name: string;
  value: string;
}

export interface HTTPHeader {
  values: ConfigurationVariable[];
}

export interface TypeConfiguration {
  typeName: string;
  renameTo: string;
}

export interface FieldConfiguration {
  typeName: string;
  fieldName: string;
  disableDefaultFieldMapping: boolean;
  path: string[];
  argumentsConfiguration: ArgumentConfiguration[];
  requiresFields: string[];
  unescapeResponseJson: boolean;
}

export interface TypeField {
  typeName: string;
  fieldNames: string[];
}

export interface SingleTypeField {
  typeName: string;
  fieldName: string;
}

export interface ArgumentConfiguration {
  name: string;
  sourceType: ArgumentSource;
  sourcePath: string[];
  renderConfiguration: ArgumentRenderConfiguration;
  renameTypeTo: string;
}

export interface WunderGraphConfiguration {
  api: UserDefinedApi | undefined;
  apiId: string;
  environmentIds: string[];
  dangerouslyEnableGraphQLEndpoint: boolean;
  configHash: string;
}

export interface S3UploadProfileHooksConfiguration {
  preUpload: boolean;
  postUpload: boolean;
}

export interface S3UploadProfile {
  requireAuthentication: boolean;
  maxAllowedUploadSizeBytes: number;
  maxAllowedFiles: number;
  allowedMimeTypes: string[];
  allowedFileExtensions: string[];
  metadataJSONSchema: string;
  hooks: S3UploadProfileHooksConfiguration | undefined;
}

export interface S3UploadConfiguration {
  name: string;
  endpoint: ConfigurationVariable | undefined;
  accessKeyID: ConfigurationVariable | undefined;
  secretAccessKey: ConfigurationVariable | undefined;
  bucketName: ConfigurationVariable | undefined;
  bucketLocation: ConfigurationVariable | undefined;
  useSSL: boolean;
  uploadProfiles: { [key: string]: S3UploadProfile };
}

export interface S3UploadConfiguration_UploadProfilesEntry {
  key: string;
  value: S3UploadProfile | undefined;
}

export interface UserDefinedApi {
  engineConfiguration: EngineConfiguration | undefined;
  enableGraphqlEndpoint: boolean;
  operations: Operation[];
  invalidOperationNames: string[];
  corsConfiguration: CorsConfiguration | undefined;
  authenticationConfig: ApiAuthenticationConfig | undefined;
  experimentalConfig: ExperimentalConfig | undefined
  s3UploadConfiguration: S3UploadConfiguration[];
  allowedHostNames: ConfigurationVariable[];
  webhooks: WebhookConfiguration[];
  serverOptions: ServerOptions | undefined;
  nodeOptions: NodeOptions | undefined;
}

export interface ListenerOptions {
  host: ConfigurationVariable | undefined;
  port: ConfigurationVariable | undefined;
}

export interface InternalListenerOptions {
  port: ConfigurationVariable | undefined;
}

export interface NodeLogging {
  level: ConfigurationVariable | undefined;
}

export interface NodeOptions {
  nodeUrl: ConfigurationVariable | undefined;
  publicNodeUrl: ConfigurationVariable | undefined;
  listen: ListenerOptions | undefined;
  logger: NodeLogging | undefined;
  defaultRequestTimeoutSeconds: number;
  listenInternal: InternalListenerOptions | undefined;
  nodeInternalUrl: ConfigurationVariable | undefined;
  defaultHttpProxyUrl: ConfigurationVariable | undefined;
}

export interface ServerLogging {
  level: ConfigurationVariable | undefined;
}

export interface ServerOptions {
  serverUrl: ConfigurationVariable | undefined;
  listen: ListenerOptions | undefined;
  logger: ServerLogging | undefined;
}

export interface WebhookConfiguration {
  /** Name of the webhook. */
  name: string;
  /**
   * The path to the bundled file.
   * The path is relative to the bundle directory.
   */
  filePath: string;
  verifier: WebhookVerifier | undefined;
}

export interface WebhookVerifier {
  kind: WebhookVerifierKind;
  secret: ConfigurationVariable | undefined;
  signatureHeader: string;
  signatureHeaderPrefix: string;
}

export interface CorsConfiguration {
  /**
   * AllowedOrigins is a list of origins a cross-domain request can be executed from.
   * If the special "*" value is present in the list, all origins will be allowed.
   * An origin may contain a wildcard (*) to replace 0 or more characters
   * (i.e.: http://*.domain.com). Usage of wildcards implies a small performance penalty.
   * Only one wildcard can be used per origin.
   * Default value is ["*"]
   */
  allowedOrigins: ConfigurationVariable[];
  /**
   * AllowedMethods is a list of methods the client is allowed to use with
   * cross-domain requests. Default value is simple methods (HEAD, GET and POST).
   */
  allowedMethods: string[];
  /**
   * AllowedHeaders is list of non simple headers the client is allowed to use with
   * cross-domain requests.
   * If the special "*" value is present in the list, all headers will be allowed.
   * Default value is [] but "Origin" is always appended to the list.
   */
  allowedHeaders: string[];
  /**
   * ExposedHeaders indicates which headers are safe to expose to the API of a CORS
   * API specification
   */
  exposedHeaders: string[];
  /**
   * MaxAge indicates how long (in seconds) the results of a preflight request
   * can be cached
   */
  maxAge: number;
  /**
   * AllowCredentials indicates whether the request can include user credentials like
   * cookies, HTTP authentication or client side SSL certificates.
   */
  allowCredentials: boolean;
}

export interface ConfigurationVariable {
  kind: ConfigurationVariableKind;
  staticVariableContent: string;
  environmentVariableName: string;
  environmentVariableDefaultValue: string;
  placeholderVariableName: string;
}

export interface BuildInfo {
  success: boolean;
  sdk: BuildInfoVersion | undefined;
  wunderctl: BuildInfoVersion | undefined;
  node: BuildInfoVersion | undefined;
  os: BuildInfoOS | undefined;
  stats: BuildInfoStats | undefined;
}

export interface BuildInfoVersion {
  version: string;
}

export interface BuildInfoOS {
  type: string;
  platform: string;
  arch: string;
  version: string;
  release: string;
}

export interface BuildInfoStats {
  totalApis: number;
  totalOperations: number;
  totalWebhooks: number;
  hasAuthenticationProvider: boolean;
  hasUploadProvider: boolean;
}

export interface ExperimentalConfig {
  orm: boolean | undefined
}

function createBaseExperimentalConfiguration(): ExperimentalConfig {
  return { orm: undefined }
}

export const ExperimentalConfig = {
  fromJSON(object: any): ExperimentalConfig {
    return {
      orm: isSet(object.orm) ? object.orm : undefined,
    };
  },

  toJSON(message: ExperimentalConfig): unknown {
    const obj: any = {};

    if (message.orm !== undefined) {
      obj.orm = message.orm
    }

    return obj
  },

  fromPartial<I extends Exact<DeepPartial<ExperimentalConfig>, I>>(object: I): ExperimentalConfig {
    const message = createBaseExperimentalConfiguration();
    if (object.orm !== undefined) {
      message.orm = message.orm
    }
    return message;
  },
}

function createBaseApiAuthenticationConfig(): ApiAuthenticationConfig {
  return { cookieBased: undefined, hooks: undefined, jwksBased: undefined, publicClaims: [] };
}

export const ApiAuthenticationConfig = {
  fromJSON(object: any): ApiAuthenticationConfig {
    return {
      cookieBased: isSet(object.cookieBased) ? CookieBasedAuthentication.fromJSON(object.cookieBased) : undefined,
      hooks: isSet(object.hooks) ? ApiAuthenticationHooks.fromJSON(object.hooks) : undefined,
      jwksBased: isSet(object.jwksBased) ? JwksBasedAuthentication.fromJSON(object.jwksBased) : undefined,
      publicClaims: Array.isArray(object?.publicClaims) ? object.publicClaims.map((e: any) => String(e)) : [],
    };
  },

  toJSON(message: ApiAuthenticationConfig): unknown {
    const obj: any = {};
    message.cookieBased !== undefined &&
      (obj.cookieBased = message.cookieBased ? CookieBasedAuthentication.toJSON(message.cookieBased) : undefined);
    message.hooks !== undefined &&
      (obj.hooks = message.hooks ? ApiAuthenticationHooks.toJSON(message.hooks) : undefined);
    message.jwksBased !== undefined &&
      (obj.jwksBased = message.jwksBased ? JwksBasedAuthentication.toJSON(message.jwksBased) : undefined);
    if (message.publicClaims) {
      obj.publicClaims = message.publicClaims.map((e) => e);
    } else {
      obj.publicClaims = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ApiAuthenticationConfig>, I>>(object: I): ApiAuthenticationConfig {
    const message = createBaseApiAuthenticationConfig();
    message.cookieBased = (object.cookieBased !== undefined && object.cookieBased !== null)
      ? CookieBasedAuthentication.fromPartial(object.cookieBased)
      : undefined;
    message.hooks = (object.hooks !== undefined && object.hooks !== null)
      ? ApiAuthenticationHooks.fromPartial(object.hooks)
      : undefined;
    message.jwksBased = (object.jwksBased !== undefined && object.jwksBased !== null)
      ? JwksBasedAuthentication.fromPartial(object.jwksBased)
      : undefined;
    message.publicClaims = object.publicClaims?.map((e) => e) || [];
    return message;
  },
};

function createBaseJwksBasedAuthentication(): JwksBasedAuthentication {
  return { providers: [] };
}

export const JwksBasedAuthentication = {
  fromJSON(object: any): JwksBasedAuthentication {
    return {
      providers: Array.isArray(object?.providers) ? object.providers.map((e: any) => JwksAuthProvider.fromJSON(e)) : [],
    };
  },

  toJSON(message: JwksBasedAuthentication): unknown {
    const obj: any = {};
    if (message.providers) {
      obj.providers = message.providers.map((e) => e ? JwksAuthProvider.toJSON(e) : undefined);
    } else {
      obj.providers = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<JwksBasedAuthentication>, I>>(object: I): JwksBasedAuthentication {
    const message = createBaseJwksBasedAuthentication();
    message.providers = object.providers?.map((e) => JwksAuthProvider.fromPartial(e)) || [];
    return message;
  },
};

function createBaseJwksAuthProvider(): JwksAuthProvider {
  return { jwksUrl: undefined, jwksJson: undefined, userInfoEndpoint: undefined, userInfoCacheTtlSeconds: 0 };
}

export const JwksAuthProvider = {
  fromJSON(object: any): JwksAuthProvider {
    return {
      jwksUrl: isSet(object.jwksUrl) ? ConfigurationVariable.fromJSON(object.jwksUrl) : undefined,
      jwksJson: isSet(object.jwksJson) ? ConfigurationVariable.fromJSON(object.jwksJson) : undefined,
      userInfoEndpoint: isSet(object.userInfoEndpoint)
        ? ConfigurationVariable.fromJSON(object.userInfoEndpoint)
        : undefined,
      userInfoCacheTtlSeconds: isSet(object.userInfoCacheTtlSeconds) ? Number(object.userInfoCacheTtlSeconds) : 0,
    };
  },

  toJSON(message: JwksAuthProvider): unknown {
    const obj: any = {};
    message.jwksUrl !== undefined &&
      (obj.jwksUrl = message.jwksUrl ? ConfigurationVariable.toJSON(message.jwksUrl) : undefined);
    message.jwksJson !== undefined &&
      (obj.jwksJson = message.jwksJson ? ConfigurationVariable.toJSON(message.jwksJson) : undefined);
    message.userInfoEndpoint !== undefined && (obj.userInfoEndpoint = message.userInfoEndpoint
      ? ConfigurationVariable.toJSON(message.userInfoEndpoint)
      : undefined);
    message.userInfoCacheTtlSeconds !== undefined &&
      (obj.userInfoCacheTtlSeconds = Math.round(message.userInfoCacheTtlSeconds));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<JwksAuthProvider>, I>>(object: I): JwksAuthProvider {
    const message = createBaseJwksAuthProvider();
    message.jwksUrl = (object.jwksUrl !== undefined && object.jwksUrl !== null)
      ? ConfigurationVariable.fromPartial(object.jwksUrl)
      : undefined;
    message.jwksJson = (object.jwksJson !== undefined && object.jwksJson !== null)
      ? ConfigurationVariable.fromPartial(object.jwksJson)
      : undefined;
    message.userInfoEndpoint = (object.userInfoEndpoint !== undefined && object.userInfoEndpoint !== null)
      ? ConfigurationVariable.fromPartial(object.userInfoEndpoint)
      : undefined;
    message.userInfoCacheTtlSeconds = object.userInfoCacheTtlSeconds ?? 0;
    return message;
  },
};

function createBaseApiAuthenticationHooks(): ApiAuthenticationHooks {
  return {
    postAuthentication: false,
    mutatingPostAuthentication: false,
    revalidateAuthentication: false,
    postLogout: false,
  };
}

export const ApiAuthenticationHooks = {
  fromJSON(object: any): ApiAuthenticationHooks {
    return {
      postAuthentication: isSet(object.postAuthentication) ? Boolean(object.postAuthentication) : false,
      mutatingPostAuthentication: isSet(object.mutatingPostAuthentication)
        ? Boolean(object.mutatingPostAuthentication)
        : false,
      revalidateAuthentication: isSet(object.revalidateAuthentication)
        ? Boolean(object.revalidateAuthentication)
        : false,
      postLogout: isSet(object.postLogout) ? Boolean(object.postLogout) : false,
    };
  },

  toJSON(message: ApiAuthenticationHooks): unknown {
    const obj: any = {};
    message.postAuthentication !== undefined && (obj.postAuthentication = message.postAuthentication);
    message.mutatingPostAuthentication !== undefined &&
      (obj.mutatingPostAuthentication = message.mutatingPostAuthentication);
    message.revalidateAuthentication !== undefined && (obj.revalidateAuthentication = message.revalidateAuthentication);
    message.postLogout !== undefined && (obj.postLogout = message.postLogout);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ApiAuthenticationHooks>, I>>(object: I): ApiAuthenticationHooks {
    const message = createBaseApiAuthenticationHooks();
    message.postAuthentication = object.postAuthentication ?? false;
    message.mutatingPostAuthentication = object.mutatingPostAuthentication ?? false;
    message.revalidateAuthentication = object.revalidateAuthentication ?? false;
    message.postLogout = object.postLogout ?? false;
    return message;
  },
};

function createBaseCookieBasedAuthentication(): CookieBasedAuthentication {
  return {
    providers: [],
    authorizedRedirectUris: [],
    authorizedRedirectUriRegexes: [],
    hashKey: undefined,
    blockKey: undefined,
    csrfSecret: undefined,
  };
}

export const CookieBasedAuthentication = {
  fromJSON(object: any): CookieBasedAuthentication {
    return {
      providers: Array.isArray(object?.providers) ? object.providers.map((e: any) => AuthProvider.fromJSON(e)) : [],
      authorizedRedirectUris: Array.isArray(object?.authorizedRedirectUris)
        ? object.authorizedRedirectUris.map((e: any) => ConfigurationVariable.fromJSON(e))
        : [],
      authorizedRedirectUriRegexes: Array.isArray(object?.authorizedRedirectUriRegexes)
        ? object.authorizedRedirectUriRegexes.map((e: any) => ConfigurationVariable.fromJSON(e))
        : [],
      hashKey: isSet(object.hashKey) ? ConfigurationVariable.fromJSON(object.hashKey) : undefined,
      blockKey: isSet(object.blockKey) ? ConfigurationVariable.fromJSON(object.blockKey) : undefined,
      csrfSecret: isSet(object.csrfSecret) ? ConfigurationVariable.fromJSON(object.csrfSecret) : undefined,
    };
  },

  toJSON(message: CookieBasedAuthentication): unknown {
    const obj: any = {};
    if (message.providers) {
      obj.providers = message.providers.map((e) => e ? AuthProvider.toJSON(e) : undefined);
    } else {
      obj.providers = [];
    }
    if (message.authorizedRedirectUris) {
      obj.authorizedRedirectUris = message.authorizedRedirectUris.map((e) =>
        e ? ConfigurationVariable.toJSON(e) : undefined
      );
    } else {
      obj.authorizedRedirectUris = [];
    }
    if (message.authorizedRedirectUriRegexes) {
      obj.authorizedRedirectUriRegexes = message.authorizedRedirectUriRegexes.map((e) =>
        e ? ConfigurationVariable.toJSON(e) : undefined
      );
    } else {
      obj.authorizedRedirectUriRegexes = [];
    }
    message.hashKey !== undefined &&
      (obj.hashKey = message.hashKey ? ConfigurationVariable.toJSON(message.hashKey) : undefined);
    message.blockKey !== undefined &&
      (obj.blockKey = message.blockKey ? ConfigurationVariable.toJSON(message.blockKey) : undefined);
    message.csrfSecret !== undefined &&
      (obj.csrfSecret = message.csrfSecret ? ConfigurationVariable.toJSON(message.csrfSecret) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CookieBasedAuthentication>, I>>(object: I): CookieBasedAuthentication {
    const message = createBaseCookieBasedAuthentication();
    message.providers = object.providers?.map((e) => AuthProvider.fromPartial(e)) || [];
    message.authorizedRedirectUris = object.authorizedRedirectUris?.map((e) => ConfigurationVariable.fromPartial(e)) ||
      [];
    message.authorizedRedirectUriRegexes =
      object.authorizedRedirectUriRegexes?.map((e) => ConfigurationVariable.fromPartial(e)) || [];
    message.hashKey = (object.hashKey !== undefined && object.hashKey !== null)
      ? ConfigurationVariable.fromPartial(object.hashKey)
      : undefined;
    message.blockKey = (object.blockKey !== undefined && object.blockKey !== null)
      ? ConfigurationVariable.fromPartial(object.blockKey)
      : undefined;
    message.csrfSecret = (object.csrfSecret !== undefined && object.csrfSecret !== null)
      ? ConfigurationVariable.fromPartial(object.csrfSecret)
      : undefined;
    return message;
  },
};

function createBaseAuthProvider(): AuthProvider {
  return { id: "", kind: 0, githubConfig: undefined, oidcConfig: undefined };
}

export const AuthProvider = {
  fromJSON(object: any): AuthProvider {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      kind: isSet(object.kind) ? authProviderKindFromJSON(object.kind) : 0,
      githubConfig: isSet(object.githubConfig) ? GithubAuthProviderConfig.fromJSON(object.githubConfig) : undefined,
      oidcConfig: isSet(object.oidcConfig) ? OpenIDConnectAuthProviderConfig.fromJSON(object.oidcConfig) : undefined,
    };
  },

  toJSON(message: AuthProvider): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.kind !== undefined && (obj.kind = authProviderKindToJSON(message.kind));
    message.githubConfig !== undefined &&
      (obj.githubConfig = message.githubConfig ? GithubAuthProviderConfig.toJSON(message.githubConfig) : undefined);
    message.oidcConfig !== undefined &&
      (obj.oidcConfig = message.oidcConfig ? OpenIDConnectAuthProviderConfig.toJSON(message.oidcConfig) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<AuthProvider>, I>>(object: I): AuthProvider {
    const message = createBaseAuthProvider();
    message.id = object.id ?? "";
    message.kind = object.kind ?? 0;
    message.githubConfig = (object.githubConfig !== undefined && object.githubConfig !== null)
      ? GithubAuthProviderConfig.fromPartial(object.githubConfig)
      : undefined;
    message.oidcConfig = (object.oidcConfig !== undefined && object.oidcConfig !== null)
      ? OpenIDConnectAuthProviderConfig.fromPartial(object.oidcConfig)
      : undefined;
    return message;
  },
};

function createBaseGithubAuthProviderConfig(): GithubAuthProviderConfig {
  return { clientId: undefined, clientSecret: undefined };
}

export const GithubAuthProviderConfig = {
  fromJSON(object: any): GithubAuthProviderConfig {
    return {
      clientId: isSet(object.clientId) ? ConfigurationVariable.fromJSON(object.clientId) : undefined,
      clientSecret: isSet(object.clientSecret) ? ConfigurationVariable.fromJSON(object.clientSecret) : undefined,
    };
  },

  toJSON(message: GithubAuthProviderConfig): unknown {
    const obj: any = {};
    message.clientId !== undefined &&
      (obj.clientId = message.clientId ? ConfigurationVariable.toJSON(message.clientId) : undefined);
    message.clientSecret !== undefined &&
      (obj.clientSecret = message.clientSecret ? ConfigurationVariable.toJSON(message.clientSecret) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<GithubAuthProviderConfig>, I>>(object: I): GithubAuthProviderConfig {
    const message = createBaseGithubAuthProviderConfig();
    message.clientId = (object.clientId !== undefined && object.clientId !== null)
      ? ConfigurationVariable.fromPartial(object.clientId)
      : undefined;
    message.clientSecret = (object.clientSecret !== undefined && object.clientSecret !== null)
      ? ConfigurationVariable.fromPartial(object.clientSecret)
      : undefined;
    return message;
  },
};

function createBaseOpenIDConnectQueryParameter(): OpenIDConnectQueryParameter {
  return { name: undefined, value: undefined };
}

export const OpenIDConnectQueryParameter = {
  fromJSON(object: any): OpenIDConnectQueryParameter {
    return {
      name: isSet(object.name) ? ConfigurationVariable.fromJSON(object.name) : undefined,
      value: isSet(object.value) ? ConfigurationVariable.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: OpenIDConnectQueryParameter): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name ? ConfigurationVariable.toJSON(message.name) : undefined);
    message.value !== undefined &&
      (obj.value = message.value ? ConfigurationVariable.toJSON(message.value) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OpenIDConnectQueryParameter>, I>>(object: I): OpenIDConnectQueryParameter {
    const message = createBaseOpenIDConnectQueryParameter();
    message.name = (object.name !== undefined && object.name !== null)
      ? ConfigurationVariable.fromPartial(object.name)
      : undefined;
    message.value = (object.value !== undefined && object.value !== null)
      ? ConfigurationVariable.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseOpenIDConnectAuthProviderConfig(): OpenIDConnectAuthProviderConfig {
  return { issuer: undefined, clientId: undefined, clientSecret: undefined, queryParameters: [] };
}

export const OpenIDConnectAuthProviderConfig = {
  fromJSON(object: any): OpenIDConnectAuthProviderConfig {
    return {
      issuer: isSet(object.issuer) ? ConfigurationVariable.fromJSON(object.issuer) : undefined,
      clientId: isSet(object.clientId) ? ConfigurationVariable.fromJSON(object.clientId) : undefined,
      clientSecret: isSet(object.clientSecret) ? ConfigurationVariable.fromJSON(object.clientSecret) : undefined,
      queryParameters: Array.isArray(object?.queryParameters)
        ? object.queryParameters.map((e: any) => OpenIDConnectQueryParameter.fromJSON(e))
        : [],
    };
  },

  toJSON(message: OpenIDConnectAuthProviderConfig): unknown {
    const obj: any = {};
    message.issuer !== undefined &&
      (obj.issuer = message.issuer ? ConfigurationVariable.toJSON(message.issuer) : undefined);
    message.clientId !== undefined &&
      (obj.clientId = message.clientId ? ConfigurationVariable.toJSON(message.clientId) : undefined);
    message.clientSecret !== undefined &&
      (obj.clientSecret = message.clientSecret ? ConfigurationVariable.toJSON(message.clientSecret) : undefined);
    if (message.queryParameters) {
      obj.queryParameters = message.queryParameters.map((e) => e ? OpenIDConnectQueryParameter.toJSON(e) : undefined);
    } else {
      obj.queryParameters = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OpenIDConnectAuthProviderConfig>, I>>(
    object: I,
  ): OpenIDConnectAuthProviderConfig {
    const message = createBaseOpenIDConnectAuthProviderConfig();
    message.issuer = (object.issuer !== undefined && object.issuer !== null)
      ? ConfigurationVariable.fromPartial(object.issuer)
      : undefined;
    message.clientId = (object.clientId !== undefined && object.clientId !== null)
      ? ConfigurationVariable.fromPartial(object.clientId)
      : undefined;
    message.clientSecret = (object.clientSecret !== undefined && object.clientSecret !== null)
      ? ConfigurationVariable.fromPartial(object.clientSecret)
      : undefined;
    message.queryParameters = object.queryParameters?.map((e) => OpenIDConnectQueryParameter.fromPartial(e)) || [];
    return message;
  },
};

function createBaseOperation(): Operation {
  return {
    name: "",
    content: "",
    operationType: 0,
    variablesSchema: "",
    responseSchema: "",
    cacheConfig: undefined,
    authenticationConfig: undefined,
    liveQueryConfig: undefined,
    authorizationConfig: undefined,
    hooksConfiguration: undefined,
    variablesConfiguration: undefined,
    internal: false,
    interpolationVariablesSchema: "",
    postResolveTransformations: [],
    engine: 0,
    path: "",
  };
}

export const Operation = {
  fromJSON(object: any): Operation {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      content: isSet(object.content) ? String(object.content) : "",
      operationType: isSet(object.operationType) ? operationTypeFromJSON(object.operationType) : 0,
      variablesSchema: isSet(object.variablesSchema) ? String(object.variablesSchema) : "",
      responseSchema: isSet(object.responseSchema) ? String(object.responseSchema) : "",
      cacheConfig: isSet(object.cacheConfig) ? OperationCacheConfig.fromJSON(object.cacheConfig) : undefined,
      authenticationConfig: isSet(object.authenticationConfig)
        ? OperationAuthenticationConfig.fromJSON(object.authenticationConfig)
        : undefined,
      liveQueryConfig: isSet(object.liveQueryConfig)
        ? OperationLiveQueryConfig.fromJSON(object.liveQueryConfig)
        : undefined,
      authorizationConfig: isSet(object.authorizationConfig)
        ? OperationAuthorizationConfig.fromJSON(object.authorizationConfig)
        : undefined,
      hooksConfiguration: isSet(object.hooksConfiguration)
        ? OperationHooksConfiguration.fromJSON(object.hooksConfiguration)
        : undefined,
      variablesConfiguration: isSet(object.variablesConfiguration)
        ? OperationVariablesConfiguration.fromJSON(object.variablesConfiguration)
        : undefined,
      internal: isSet(object.internal) ? Boolean(object.internal) : false,
      interpolationVariablesSchema: isSet(object.interpolationVariablesSchema)
        ? String(object.interpolationVariablesSchema)
        : "",
      postResolveTransformations: Array.isArray(object?.postResolveTransformations)
        ? object.postResolveTransformations.map((e: any) => PostResolveTransformation.fromJSON(e))
        : [],
      engine: isSet(object.engine) ? operationExecutionEngineFromJSON(object.engine) : 0,
      path: isSet(object.path) ? String(object.path) : "",
    };
  },

  toJSON(message: Operation): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.content !== undefined && (obj.content = message.content);
    message.operationType !== undefined && (obj.operationType = operationTypeToJSON(message.operationType));
    message.variablesSchema !== undefined && (obj.variablesSchema = message.variablesSchema);
    message.responseSchema !== undefined && (obj.responseSchema = message.responseSchema);
    message.cacheConfig !== undefined &&
      (obj.cacheConfig = message.cacheConfig ? OperationCacheConfig.toJSON(message.cacheConfig) : undefined);
    message.authenticationConfig !== undefined && (obj.authenticationConfig = message.authenticationConfig
      ? OperationAuthenticationConfig.toJSON(message.authenticationConfig)
      : undefined);
    message.liveQueryConfig !== undefined && (obj.liveQueryConfig = message.liveQueryConfig
      ? OperationLiveQueryConfig.toJSON(message.liveQueryConfig)
      : undefined);
    message.authorizationConfig !== undefined && (obj.authorizationConfig = message.authorizationConfig
      ? OperationAuthorizationConfig.toJSON(message.authorizationConfig)
      : undefined);
    message.hooksConfiguration !== undefined && (obj.hooksConfiguration = message.hooksConfiguration
      ? OperationHooksConfiguration.toJSON(message.hooksConfiguration)
      : undefined);
    message.variablesConfiguration !== undefined && (obj.variablesConfiguration = message.variablesConfiguration
      ? OperationVariablesConfiguration.toJSON(message.variablesConfiguration)
      : undefined);
    message.internal !== undefined && (obj.internal = message.internal);
    message.interpolationVariablesSchema !== undefined &&
      (obj.interpolationVariablesSchema = message.interpolationVariablesSchema);
    if (message.postResolveTransformations) {
      obj.postResolveTransformations = message.postResolveTransformations.map((e) =>
        e ? PostResolveTransformation.toJSON(e) : undefined
      );
    } else {
      obj.postResolveTransformations = [];
    }
    message.engine !== undefined && (obj.engine = operationExecutionEngineToJSON(message.engine));
    message.path !== undefined && (obj.path = message.path);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Operation>, I>>(object: I): Operation {
    const message = createBaseOperation();
    message.name = object.name ?? "";
    message.content = object.content ?? "";
    message.operationType = object.operationType ?? 0;
    message.variablesSchema = object.variablesSchema ?? "";
    message.responseSchema = object.responseSchema ?? "";
    message.cacheConfig = (object.cacheConfig !== undefined && object.cacheConfig !== null)
      ? OperationCacheConfig.fromPartial(object.cacheConfig)
      : undefined;
    message.authenticationConfig = (object.authenticationConfig !== undefined && object.authenticationConfig !== null)
      ? OperationAuthenticationConfig.fromPartial(object.authenticationConfig)
      : undefined;
    message.liveQueryConfig = (object.liveQueryConfig !== undefined && object.liveQueryConfig !== null)
      ? OperationLiveQueryConfig.fromPartial(object.liveQueryConfig)
      : undefined;
    message.authorizationConfig = (object.authorizationConfig !== undefined && object.authorizationConfig !== null)
      ? OperationAuthorizationConfig.fromPartial(object.authorizationConfig)
      : undefined;
    message.hooksConfiguration = (object.hooksConfiguration !== undefined && object.hooksConfiguration !== null)
      ? OperationHooksConfiguration.fromPartial(object.hooksConfiguration)
      : undefined;
    message.variablesConfiguration =
      (object.variablesConfiguration !== undefined && object.variablesConfiguration !== null)
        ? OperationVariablesConfiguration.fromPartial(object.variablesConfiguration)
        : undefined;
    message.internal = object.internal ?? false;
    message.interpolationVariablesSchema = object.interpolationVariablesSchema ?? "";
    message.postResolveTransformations = object.postResolveTransformations?.map((e) =>
      PostResolveTransformation.fromPartial(e)
    ) || [];
    message.engine = object.engine ?? 0;
    message.path = object.path ?? "";
    return message;
  },
};

function createBasePostResolveTransformation(): PostResolveTransformation {
  return { kind: 0, depth: 0, get: undefined };
}

export const PostResolveTransformation = {
  fromJSON(object: any): PostResolveTransformation {
    return {
      kind: isSet(object.kind) ? postResolveTransformationKindFromJSON(object.kind) : 0,
      depth: isSet(object.depth) ? Number(object.depth) : 0,
      get: isSet(object.get) ? PostResolveGetTransformation.fromJSON(object.get) : undefined,
    };
  },

  toJSON(message: PostResolveTransformation): unknown {
    const obj: any = {};
    message.kind !== undefined && (obj.kind = postResolveTransformationKindToJSON(message.kind));
    message.depth !== undefined && (obj.depth = Math.round(message.depth));
    message.get !== undefined && (obj.get = message.get ? PostResolveGetTransformation.toJSON(message.get) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PostResolveTransformation>, I>>(object: I): PostResolveTransformation {
    const message = createBasePostResolveTransformation();
    message.kind = object.kind ?? 0;
    message.depth = object.depth ?? 0;
    message.get = (object.get !== undefined && object.get !== null)
      ? PostResolveGetTransformation.fromPartial(object.get)
      : undefined;
    return message;
  },
};

function createBasePostResolveGetTransformation(): PostResolveGetTransformation {
  return { from: [], to: [] };
}

export const PostResolveGetTransformation = {
  fromJSON(object: any): PostResolveGetTransformation {
    return {
      from: Array.isArray(object?.from) ? object.from.map((e: any) => String(e)) : [],
      to: Array.isArray(object?.to) ? object.to.map((e: any) => String(e)) : [],
    };
  },

  toJSON(message: PostResolveGetTransformation): unknown {
    const obj: any = {};
    if (message.from) {
      obj.from = message.from.map((e) => e);
    } else {
      obj.from = [];
    }
    if (message.to) {
      obj.to = message.to.map((e) => e);
    } else {
      obj.to = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PostResolveGetTransformation>, I>>(object: I): PostResolveGetTransformation {
    const message = createBasePostResolveGetTransformation();
    message.from = object.from?.map((e) => e) || [];
    message.to = object.to?.map((e) => e) || [];
    return message;
  },
};

function createBaseOperationVariablesConfiguration(): OperationVariablesConfiguration {
  return { injectVariables: [] };
}

export const OperationVariablesConfiguration = {
  fromJSON(object: any): OperationVariablesConfiguration {
    return {
      injectVariables: Array.isArray(object?.injectVariables)
        ? object.injectVariables.map((e: any) => VariableInjectionConfiguration.fromJSON(e))
        : [],
    };
  },

  toJSON(message: OperationVariablesConfiguration): unknown {
    const obj: any = {};
    if (message.injectVariables) {
      obj.injectVariables = message.injectVariables.map((e) =>
        e ? VariableInjectionConfiguration.toJSON(e) : undefined
      );
    } else {
      obj.injectVariables = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationVariablesConfiguration>, I>>(
    object: I,
  ): OperationVariablesConfiguration {
    const message = createBaseOperationVariablesConfiguration();
    message.injectVariables = object.injectVariables?.map((e) => VariableInjectionConfiguration.fromPartial(e)) || [];
    return message;
  },
};

function createBaseVariableInjectionConfiguration(): VariableInjectionConfiguration {
  return { variablePathComponents: [], variableKind: 0, dateFormat: "", environmentVariableName: "" };
}

export const VariableInjectionConfiguration = {
  fromJSON(object: any): VariableInjectionConfiguration {
    return {
      variablePathComponents: Array.isArray(object?.variablePathComponents)
        ? object.variablePathComponents.map((e: any) => String(e))
        : [],
      variableKind: isSet(object.variableKind) ? injectVariableKindFromJSON(object.variableKind) : 0,
      dateFormat: isSet(object.dateFormat) ? String(object.dateFormat) : "",
      environmentVariableName: isSet(object.environmentVariableName) ? String(object.environmentVariableName) : "",
    };
  },

  toJSON(message: VariableInjectionConfiguration): unknown {
    const obj: any = {};
    if (message.variablePathComponents) {
      obj.variablePathComponents = message.variablePathComponents.map((e) => e);
    } else {
      obj.variablePathComponents = [];
    }
    message.variableKind !== undefined && (obj.variableKind = injectVariableKindToJSON(message.variableKind));
    message.dateFormat !== undefined && (obj.dateFormat = message.dateFormat);
    message.environmentVariableName !== undefined && (obj.environmentVariableName = message.environmentVariableName);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<VariableInjectionConfiguration>, I>>(
    object: I,
  ): VariableInjectionConfiguration {
    const message = createBaseVariableInjectionConfiguration();
    message.variablePathComponents = object.variablePathComponents?.map((e) => e) || [];
    message.variableKind = object.variableKind ?? 0;
    message.dateFormat = object.dateFormat ?? "";
    message.environmentVariableName = object.environmentVariableName ?? "";
    return message;
  },
};

function createBaseGraphQLDataSourceHooksConfiguration(): GraphQLDataSourceHooksConfiguration {
  return { onWSTransportConnectionInit: false };
}

export const GraphQLDataSourceHooksConfiguration = {
  fromJSON(object: any): GraphQLDataSourceHooksConfiguration {
    return {
      onWSTransportConnectionInit: isSet(object.onWSTransportConnectionInit)
        ? Boolean(object.onWSTransportConnectionInit)
        : false,
    };
  },

  toJSON(message: GraphQLDataSourceHooksConfiguration): unknown {
    const obj: any = {};
    message.onWSTransportConnectionInit !== undefined &&
      (obj.onWSTransportConnectionInit = message.onWSTransportConnectionInit);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<GraphQLDataSourceHooksConfiguration>, I>>(
    object: I,
  ): GraphQLDataSourceHooksConfiguration {
    const message = createBaseGraphQLDataSourceHooksConfiguration();
    message.onWSTransportConnectionInit = object.onWSTransportConnectionInit ?? false;
    return message;
  },
};

function createBaseOperationHooksConfiguration(): OperationHooksConfiguration {
  return {
    preResolve: false,
    postResolve: false,
    mutatingPreResolve: false,
    mutatingPostResolve: false,
    mockResolve: undefined,
    httpTransportOnRequest: false,
    httpTransportOnResponse: false,
    customResolve: false,
  };
}

export const OperationHooksConfiguration = {
  fromJSON(object: any): OperationHooksConfiguration {
    return {
      preResolve: isSet(object.preResolve) ? Boolean(object.preResolve) : false,
      postResolve: isSet(object.postResolve) ? Boolean(object.postResolve) : false,
      mutatingPreResolve: isSet(object.mutatingPreResolve) ? Boolean(object.mutatingPreResolve) : false,
      mutatingPostResolve: isSet(object.mutatingPostResolve) ? Boolean(object.mutatingPostResolve) : false,
      mockResolve: isSet(object.mockResolve) ? MockResolveHookConfiguration.fromJSON(object.mockResolve) : undefined,
      httpTransportOnRequest: isSet(object.httpTransportOnRequest) ? Boolean(object.httpTransportOnRequest) : false,
      httpTransportOnResponse: isSet(object.httpTransportOnResponse) ? Boolean(object.httpTransportOnResponse) : false,
      customResolve: isSet(object.customResolve) ? Boolean(object.customResolve) : false,
    };
  },

  toJSON(message: OperationHooksConfiguration): unknown {
    const obj: any = {};
    message.preResolve !== undefined && (obj.preResolve = message.preResolve);
    message.postResolve !== undefined && (obj.postResolve = message.postResolve);
    message.mutatingPreResolve !== undefined && (obj.mutatingPreResolve = message.mutatingPreResolve);
    message.mutatingPostResolve !== undefined && (obj.mutatingPostResolve = message.mutatingPostResolve);
    message.mockResolve !== undefined &&
      (obj.mockResolve = message.mockResolve ? MockResolveHookConfiguration.toJSON(message.mockResolve) : undefined);
    message.httpTransportOnRequest !== undefined && (obj.httpTransportOnRequest = message.httpTransportOnRequest);
    message.httpTransportOnResponse !== undefined && (obj.httpTransportOnResponse = message.httpTransportOnResponse);
    message.customResolve !== undefined && (obj.customResolve = message.customResolve);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationHooksConfiguration>, I>>(object: I): OperationHooksConfiguration {
    const message = createBaseOperationHooksConfiguration();
    message.preResolve = object.preResolve ?? false;
    message.postResolve = object.postResolve ?? false;
    message.mutatingPreResolve = object.mutatingPreResolve ?? false;
    message.mutatingPostResolve = object.mutatingPostResolve ?? false;
    message.mockResolve = (object.mockResolve !== undefined && object.mockResolve !== null)
      ? MockResolveHookConfiguration.fromPartial(object.mockResolve)
      : undefined;
    message.httpTransportOnRequest = object.httpTransportOnRequest ?? false;
    message.httpTransportOnResponse = object.httpTransportOnResponse ?? false;
    message.customResolve = object.customResolve ?? false;
    return message;
  },
};

function createBaseMockResolveHookConfiguration(): MockResolveHookConfiguration {
  return { enable: false, subscriptionPollingIntervalMillis: 0 };
}

export const MockResolveHookConfiguration = {
  fromJSON(object: any): MockResolveHookConfiguration {
    return {
      enable: isSet(object.enable) ? Boolean(object.enable) : false,
      subscriptionPollingIntervalMillis: isSet(object.subscriptionPollingIntervalMillis)
        ? Number(object.subscriptionPollingIntervalMillis)
        : 0,
    };
  },

  toJSON(message: MockResolveHookConfiguration): unknown {
    const obj: any = {};
    message.enable !== undefined && (obj.enable = message.enable);
    message.subscriptionPollingIntervalMillis !== undefined &&
      (obj.subscriptionPollingIntervalMillis = Math.round(message.subscriptionPollingIntervalMillis));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<MockResolveHookConfiguration>, I>>(object: I): MockResolveHookConfiguration {
    const message = createBaseMockResolveHookConfiguration();
    message.enable = object.enable ?? false;
    message.subscriptionPollingIntervalMillis = object.subscriptionPollingIntervalMillis ?? 0;
    return message;
  },
};

function createBaseOperationAuthorizationConfig(): OperationAuthorizationConfig {
  return { claims: [], roleConfig: undefined };
}

export const OperationAuthorizationConfig = {
  fromJSON(object: any): OperationAuthorizationConfig {
    return {
      claims: Array.isArray(object?.claims) ? object.claims.map((e: any) => ClaimConfig.fromJSON(e)) : [],
      roleConfig: isSet(object.roleConfig) ? OperationRoleConfig.fromJSON(object.roleConfig) : undefined,
    };
  },

  toJSON(message: OperationAuthorizationConfig): unknown {
    const obj: any = {};
    if (message.claims) {
      obj.claims = message.claims.map((e) => e ? ClaimConfig.toJSON(e) : undefined);
    } else {
      obj.claims = [];
    }
    message.roleConfig !== undefined &&
      (obj.roleConfig = message.roleConfig ? OperationRoleConfig.toJSON(message.roleConfig) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationAuthorizationConfig>, I>>(object: I): OperationAuthorizationConfig {
    const message = createBaseOperationAuthorizationConfig();
    message.claims = object.claims?.map((e) => ClaimConfig.fromPartial(e)) || [];
    message.roleConfig = (object.roleConfig !== undefined && object.roleConfig !== null)
      ? OperationRoleConfig.fromPartial(object.roleConfig)
      : undefined;
    return message;
  },
};

function createBaseOperationRoleConfig(): OperationRoleConfig {
  return { requireMatchAll: [], requireMatchAny: [], denyMatchAll: [], denyMatchAny: [] };
}

export const OperationRoleConfig = {
  fromJSON(object: any): OperationRoleConfig {
    return {
      requireMatchAll: Array.isArray(object?.requireMatchAll) ? object.requireMatchAll.map((e: any) => String(e)) : [],
      requireMatchAny: Array.isArray(object?.requireMatchAny) ? object.requireMatchAny.map((e: any) => String(e)) : [],
      denyMatchAll: Array.isArray(object?.denyMatchAll) ? object.denyMatchAll.map((e: any) => String(e)) : [],
      denyMatchAny: Array.isArray(object?.denyMatchAny) ? object.denyMatchAny.map((e: any) => String(e)) : [],
    };
  },

  toJSON(message: OperationRoleConfig): unknown {
    const obj: any = {};
    if (message.requireMatchAll) {
      obj.requireMatchAll = message.requireMatchAll.map((e) => e);
    } else {
      obj.requireMatchAll = [];
    }
    if (message.requireMatchAny) {
      obj.requireMatchAny = message.requireMatchAny.map((e) => e);
    } else {
      obj.requireMatchAny = [];
    }
    if (message.denyMatchAll) {
      obj.denyMatchAll = message.denyMatchAll.map((e) => e);
    } else {
      obj.denyMatchAll = [];
    }
    if (message.denyMatchAny) {
      obj.denyMatchAny = message.denyMatchAny.map((e) => e);
    } else {
      obj.denyMatchAny = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationRoleConfig>, I>>(object: I): OperationRoleConfig {
    const message = createBaseOperationRoleConfig();
    message.requireMatchAll = object.requireMatchAll?.map((e) => e) || [];
    message.requireMatchAny = object.requireMatchAny?.map((e) => e) || [];
    message.denyMatchAll = object.denyMatchAll?.map((e) => e) || [];
    message.denyMatchAny = object.denyMatchAny?.map((e) => e) || [];
    return message;
  },
};

function createBaseCustomClaim(): CustomClaim {
  return { name: "", jsonPathComponents: [], type: 0, required: false };
}

export const CustomClaim = {
  fromJSON(object: any): CustomClaim {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      jsonPathComponents: Array.isArray(object?.jsonPathComponents)
        ? object.jsonPathComponents.map((e: any) => String(e))
        : [],
      type: isSet(object.type) ? valueTypeFromJSON(object.type) : 0,
      required: isSet(object.required) ? Boolean(object.required) : false,
    };
  },

  toJSON(message: CustomClaim): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    if (message.jsonPathComponents) {
      obj.jsonPathComponents = message.jsonPathComponents.map((e) => e);
    } else {
      obj.jsonPathComponents = [];
    }
    message.type !== undefined && (obj.type = valueTypeToJSON(message.type));
    message.required !== undefined && (obj.required = message.required);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CustomClaim>, I>>(object: I): CustomClaim {
    const message = createBaseCustomClaim();
    message.name = object.name ?? "";
    message.jsonPathComponents = object.jsonPathComponents?.map((e) => e) || [];
    message.type = object.type ?? 0;
    message.required = object.required ?? false;
    return message;
  },
};

function createBaseClaimConfig(): ClaimConfig {
  return { variablePathComponents: [], claimType: 0, custom: undefined };
}

export const ClaimConfig = {
  fromJSON(object: any): ClaimConfig {
    return {
      variablePathComponents: Array.isArray(object?.variablePathComponents)
        ? object.variablePathComponents.map((e: any) => String(e))
        : [],
      claimType: isSet(object.claimType) ? claimTypeFromJSON(object.claimType) : 0,
      custom: isSet(object.custom) ? CustomClaim.fromJSON(object.custom) : undefined,
    };
  },

  toJSON(message: ClaimConfig): unknown {
    const obj: any = {};
    if (message.variablePathComponents) {
      obj.variablePathComponents = message.variablePathComponents.map((e) => e);
    } else {
      obj.variablePathComponents = [];
    }
    message.claimType !== undefined && (obj.claimType = claimTypeToJSON(message.claimType));
    message.custom !== undefined && (obj.custom = message.custom ? CustomClaim.toJSON(message.custom) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ClaimConfig>, I>>(object: I): ClaimConfig {
    const message = createBaseClaimConfig();
    message.variablePathComponents = object.variablePathComponents?.map((e) => e) || [];
    message.claimType = object.claimType ?? 0;
    message.custom = (object.custom !== undefined && object.custom !== null)
      ? CustomClaim.fromPartial(object.custom)
      : undefined;
    return message;
  },
};

function createBaseOperationLiveQueryConfig(): OperationLiveQueryConfig {
  return { enable: false, pollingIntervalSeconds: 0 };
}

export const OperationLiveQueryConfig = {
  fromJSON(object: any): OperationLiveQueryConfig {
    return {
      enable: isSet(object.enable) ? Boolean(object.enable) : false,
      pollingIntervalSeconds: isSet(object.pollingIntervalSeconds) ? Number(object.pollingIntervalSeconds) : 0,
    };
  },

  toJSON(message: OperationLiveQueryConfig): unknown {
    const obj: any = {};
    message.enable !== undefined && (obj.enable = message.enable);
    message.pollingIntervalSeconds !== undefined &&
      (obj.pollingIntervalSeconds = Math.round(message.pollingIntervalSeconds));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationLiveQueryConfig>, I>>(object: I): OperationLiveQueryConfig {
    const message = createBaseOperationLiveQueryConfig();
    message.enable = object.enable ?? false;
    message.pollingIntervalSeconds = object.pollingIntervalSeconds ?? 0;
    return message;
  },
};

function createBaseOperationAuthenticationConfig(): OperationAuthenticationConfig {
  return { authRequired: false };
}

export const OperationAuthenticationConfig = {
  fromJSON(object: any): OperationAuthenticationConfig {
    return { authRequired: isSet(object.authRequired) ? Boolean(object.authRequired) : false };
  },

  toJSON(message: OperationAuthenticationConfig): unknown {
    const obj: any = {};
    message.authRequired !== undefined && (obj.authRequired = message.authRequired);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationAuthenticationConfig>, I>>(
    object: I,
  ): OperationAuthenticationConfig {
    const message = createBaseOperationAuthenticationConfig();
    message.authRequired = object.authRequired ?? false;
    return message;
  },
};

function createBaseOperationCacheConfig(): OperationCacheConfig {
  return { enable: false, maxAge: 0, public: false, staleWhileRevalidate: 0 };
}

export const OperationCacheConfig = {
  fromJSON(object: any): OperationCacheConfig {
    return {
      enable: isSet(object.enable) ? Boolean(object.enable) : false,
      maxAge: isSet(object.maxAge) ? Number(object.maxAge) : 0,
      public: isSet(object.public) ? Boolean(object.public) : false,
      staleWhileRevalidate: isSet(object.staleWhileRevalidate) ? Number(object.staleWhileRevalidate) : 0,
    };
  },

  toJSON(message: OperationCacheConfig): unknown {
    const obj: any = {};
    message.enable !== undefined && (obj.enable = message.enable);
    message.maxAge !== undefined && (obj.maxAge = Math.round(message.maxAge));
    message.public !== undefined && (obj.public = message.public);
    message.staleWhileRevalidate !== undefined && (obj.staleWhileRevalidate = Math.round(message.staleWhileRevalidate));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationCacheConfig>, I>>(object: I): OperationCacheConfig {
    const message = createBaseOperationCacheConfig();
    message.enable = object.enable ?? false;
    message.maxAge = object.maxAge ?? 0;
    message.public = object.public ?? false;
    message.staleWhileRevalidate = object.staleWhileRevalidate ?? 0;
    return message;
  },
};

function createBaseEngineConfiguration(): EngineConfiguration {
  return {
    defaultFlushInterval: 0,
    datasourceConfigurations: [],
    fieldConfigurations: [],
    graphqlSchema: "",
    typeConfigurations: [],
  };
}

export const EngineConfiguration = {
  fromJSON(object: any): EngineConfiguration {
    return {
      defaultFlushInterval: isSet(object.defaultFlushInterval) ? Number(object.defaultFlushInterval) : 0,
      datasourceConfigurations: Array.isArray(object?.datasourceConfigurations)
        ? object.datasourceConfigurations.map((e: any) => DataSourceConfiguration.fromJSON(e))
        : [],
      fieldConfigurations: Array.isArray(object?.fieldConfigurations)
        ? object.fieldConfigurations.map((e: any) => FieldConfiguration.fromJSON(e))
        : [],
      graphqlSchema: isSet(object.graphqlSchema) ? String(object.graphqlSchema) : "",
      typeConfigurations: Array.isArray(object?.typeConfigurations)
        ? object.typeConfigurations.map((e: any) => TypeConfiguration.fromJSON(e))
        : [],
    };
  },

  toJSON(message: EngineConfiguration): unknown {
    const obj: any = {};
    message.defaultFlushInterval !== undefined && (obj.defaultFlushInterval = Math.round(message.defaultFlushInterval));
    if (message.datasourceConfigurations) {
      obj.datasourceConfigurations = message.datasourceConfigurations.map((e) =>
        e ? DataSourceConfiguration.toJSON(e) : undefined
      );
    } else {
      obj.datasourceConfigurations = [];
    }
    if (message.fieldConfigurations) {
      obj.fieldConfigurations = message.fieldConfigurations.map((e) => e ? FieldConfiguration.toJSON(e) : undefined);
    } else {
      obj.fieldConfigurations = [];
    }
    message.graphqlSchema !== undefined && (obj.graphqlSchema = message.graphqlSchema);
    if (message.typeConfigurations) {
      obj.typeConfigurations = message.typeConfigurations.map((e) => e ? TypeConfiguration.toJSON(e) : undefined);
    } else {
      obj.typeConfigurations = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EngineConfiguration>, I>>(object: I): EngineConfiguration {
    const message = createBaseEngineConfiguration();
    message.defaultFlushInterval = object.defaultFlushInterval ?? 0;
    message.datasourceConfigurations =
      object.datasourceConfigurations?.map((e) => DataSourceConfiguration.fromPartial(e)) || [];
    message.fieldConfigurations = object.fieldConfigurations?.map((e) => FieldConfiguration.fromPartial(e)) || [];
    message.graphqlSchema = object.graphqlSchema ?? "";
    message.typeConfigurations = object.typeConfigurations?.map((e) => TypeConfiguration.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDataSourceConfiguration(): DataSourceConfiguration {
  return {
    kind: 0,
    rootNodes: [],
    childNodes: [],
    overrideFieldPathFromAlias: false,
    customRest: undefined,
    customGraphql: undefined,
    customStatic: undefined,
    customDatabase: undefined,
    directives: [],
    requestTimeoutSeconds: 0,
    id: "",
  };
}

export const DataSourceConfiguration = {
  fromJSON(object: any): DataSourceConfiguration {
    return {
      kind: isSet(object.kind) ? dataSourceKindFromJSON(object.kind) : 0,
      rootNodes: Array.isArray(object?.rootNodes) ? object.rootNodes.map((e: any) => TypeField.fromJSON(e)) : [],
      childNodes: Array.isArray(object?.childNodes) ? object.childNodes.map((e: any) => TypeField.fromJSON(e)) : [],
      overrideFieldPathFromAlias: isSet(object.overrideFieldPathFromAlias)
        ? Boolean(object.overrideFieldPathFromAlias)
        : false,
      customRest: isSet(object.customRest) ? DataSourceCustomREST.fromJSON(object.customRest) : undefined,
      customGraphql: isSet(object.customGraphql) ? DataSourceCustomGraphQL.fromJSON(object.customGraphql) : undefined,
      customStatic: isSet(object.customStatic) ? DataSourceCustomStatic.fromJSON(object.customStatic) : undefined,
      customDatabase: isSet(object.customDatabase)
        ? DataSourceCustomDatabase.fromJSON(object.customDatabase)
        : undefined,
      directives: Array.isArray(object?.directives)
        ? object.directives.map((e: any) => DirectiveConfiguration.fromJSON(e))
        : [],
      requestTimeoutSeconds: isSet(object.requestTimeoutSeconds) ? Number(object.requestTimeoutSeconds) : 0,
      id: isSet(object.id) ? String(object.id) : "",
    };
  },

  toJSON(message: DataSourceConfiguration): unknown {
    const obj: any = {};
    message.kind !== undefined && (obj.kind = dataSourceKindToJSON(message.kind));
    if (message.rootNodes) {
      obj.rootNodes = message.rootNodes.map((e) => e ? TypeField.toJSON(e) : undefined);
    } else {
      obj.rootNodes = [];
    }
    if (message.childNodes) {
      obj.childNodes = message.childNodes.map((e) => e ? TypeField.toJSON(e) : undefined);
    } else {
      obj.childNodes = [];
    }
    message.overrideFieldPathFromAlias !== undefined &&
      (obj.overrideFieldPathFromAlias = message.overrideFieldPathFromAlias);
    message.customRest !== undefined &&
      (obj.customRest = message.customRest ? DataSourceCustomREST.toJSON(message.customRest) : undefined);
    message.customGraphql !== undefined &&
      (obj.customGraphql = message.customGraphql ? DataSourceCustomGraphQL.toJSON(message.customGraphql) : undefined);
    message.customStatic !== undefined &&
      (obj.customStatic = message.customStatic ? DataSourceCustomStatic.toJSON(message.customStatic) : undefined);
    message.customDatabase !== undefined &&
      (obj.customDatabase = message.customDatabase
        ? DataSourceCustomDatabase.toJSON(message.customDatabase)
        : undefined);
    if (message.directives) {
      obj.directives = message.directives.map((e) => e ? DirectiveConfiguration.toJSON(e) : undefined);
    } else {
      obj.directives = [];
    }
    message.requestTimeoutSeconds !== undefined &&
      (obj.requestTimeoutSeconds = Math.round(message.requestTimeoutSeconds));
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DataSourceConfiguration>, I>>(object: I): DataSourceConfiguration {
    const message = createBaseDataSourceConfiguration();
    message.kind = object.kind ?? 0;
    message.rootNodes = object.rootNodes?.map((e) => TypeField.fromPartial(e)) || [];
    message.childNodes = object.childNodes?.map((e) => TypeField.fromPartial(e)) || [];
    message.overrideFieldPathFromAlias = object.overrideFieldPathFromAlias ?? false;
    message.customRest = (object.customRest !== undefined && object.customRest !== null)
      ? DataSourceCustomREST.fromPartial(object.customRest)
      : undefined;
    message.customGraphql = (object.customGraphql !== undefined && object.customGraphql !== null)
      ? DataSourceCustomGraphQL.fromPartial(object.customGraphql)
      : undefined;
    message.customStatic = (object.customStatic !== undefined && object.customStatic !== null)
      ? DataSourceCustomStatic.fromPartial(object.customStatic)
      : undefined;
    message.customDatabase = (object.customDatabase !== undefined && object.customDatabase !== null)
      ? DataSourceCustomDatabase.fromPartial(object.customDatabase)
      : undefined;
    message.directives = object.directives?.map((e) => DirectiveConfiguration.fromPartial(e)) || [];
    message.requestTimeoutSeconds = object.requestTimeoutSeconds ?? 0;
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseDirectiveConfiguration(): DirectiveConfiguration {
  return { directiveName: "", renameTo: "" };
}

export const DirectiveConfiguration = {
  fromJSON(object: any): DirectiveConfiguration {
    return {
      directiveName: isSet(object.directiveName) ? String(object.directiveName) : "",
      renameTo: isSet(object.renameTo) ? String(object.renameTo) : "",
    };
  },

  toJSON(message: DirectiveConfiguration): unknown {
    const obj: any = {};
    message.directiveName !== undefined && (obj.directiveName = message.directiveName);
    message.renameTo !== undefined && (obj.renameTo = message.renameTo);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DirectiveConfiguration>, I>>(object: I): DirectiveConfiguration {
    const message = createBaseDirectiveConfiguration();
    message.directiveName = object.directiveName ?? "";
    message.renameTo = object.renameTo ?? "";
    return message;
  },
};

function createBaseDataSourceCustomREST(): DataSourceCustomREST {
  return { fetch: undefined, subscription: undefined, statusCodeTypeMappings: [], defaultTypeName: "" };
}

export const DataSourceCustomREST = {
  fromJSON(object: any): DataSourceCustomREST {
    return {
      fetch: isSet(object.fetch) ? FetchConfiguration.fromJSON(object.fetch) : undefined,
      subscription: isSet(object.subscription)
        ? RESTSubscriptionConfiguration.fromJSON(object.subscription)
        : undefined,
      statusCodeTypeMappings: Array.isArray(object?.statusCodeTypeMappings)
        ? object.statusCodeTypeMappings.map((e: any) => StatusCodeTypeMapping.fromJSON(e))
        : [],
      defaultTypeName: isSet(object.defaultTypeName) ? String(object.defaultTypeName) : "",
    };
  },

  toJSON(message: DataSourceCustomREST): unknown {
    const obj: any = {};
    message.fetch !== undefined && (obj.fetch = message.fetch ? FetchConfiguration.toJSON(message.fetch) : undefined);
    message.subscription !== undefined &&
      (obj.subscription = message.subscription
        ? RESTSubscriptionConfiguration.toJSON(message.subscription)
        : undefined);
    if (message.statusCodeTypeMappings) {
      obj.statusCodeTypeMappings = message.statusCodeTypeMappings.map((e) =>
        e ? StatusCodeTypeMapping.toJSON(e) : undefined
      );
    } else {
      obj.statusCodeTypeMappings = [];
    }
    message.defaultTypeName !== undefined && (obj.defaultTypeName = message.defaultTypeName);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DataSourceCustomREST>, I>>(object: I): DataSourceCustomREST {
    const message = createBaseDataSourceCustomREST();
    message.fetch = (object.fetch !== undefined && object.fetch !== null)
      ? FetchConfiguration.fromPartial(object.fetch)
      : undefined;
    message.subscription = (object.subscription !== undefined && object.subscription !== null)
      ? RESTSubscriptionConfiguration.fromPartial(object.subscription)
      : undefined;
    message.statusCodeTypeMappings = object.statusCodeTypeMappings?.map((e) => StatusCodeTypeMapping.fromPartial(e)) ||
      [];
    message.defaultTypeName = object.defaultTypeName ?? "";
    return message;
  },
};

function createBaseStatusCodeTypeMapping(): StatusCodeTypeMapping {
  return { statusCode: 0, typeName: "", injectStatusCodeIntoBody: false };
}

export const StatusCodeTypeMapping = {
  fromJSON(object: any): StatusCodeTypeMapping {
    return {
      statusCode: isSet(object.statusCode) ? Number(object.statusCode) : 0,
      typeName: isSet(object.typeName) ? String(object.typeName) : "",
      injectStatusCodeIntoBody: isSet(object.injectStatusCodeIntoBody)
        ? Boolean(object.injectStatusCodeIntoBody)
        : false,
    };
  },

  toJSON(message: StatusCodeTypeMapping): unknown {
    const obj: any = {};
    message.statusCode !== undefined && (obj.statusCode = Math.round(message.statusCode));
    message.typeName !== undefined && (obj.typeName = message.typeName);
    message.injectStatusCodeIntoBody !== undefined && (obj.injectStatusCodeIntoBody = message.injectStatusCodeIntoBody);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<StatusCodeTypeMapping>, I>>(object: I): StatusCodeTypeMapping {
    const message = createBaseStatusCodeTypeMapping();
    message.statusCode = object.statusCode ?? 0;
    message.typeName = object.typeName ?? "";
    message.injectStatusCodeIntoBody = object.injectStatusCodeIntoBody ?? false;
    return message;
  },
};

function createBaseDataSourceCustomGraphQL(): DataSourceCustomGraphQL {
  return {
    fetch: undefined,
    subscription: undefined,
    federation: undefined,
    upstreamSchema: "",
    hooksConfiguration: undefined,
    customScalarTypeFields: [],
  };
}

export const DataSourceCustomGraphQL = {
  fromJSON(object: any): DataSourceCustomGraphQL {
    return {
      fetch: isSet(object.fetch) ? FetchConfiguration.fromJSON(object.fetch) : undefined,
      subscription: isSet(object.subscription)
        ? GraphQLSubscriptionConfiguration.fromJSON(object.subscription)
        : undefined,
      federation: isSet(object.federation) ? GraphQLFederationConfiguration.fromJSON(object.federation) : undefined,
      upstreamSchema: isSet(object.upstreamSchema) ? String(object.upstreamSchema) : "",
      hooksConfiguration: isSet(object.hooksConfiguration)
        ? GraphQLDataSourceHooksConfiguration.fromJSON(object.hooksConfiguration)
        : undefined,
      customScalarTypeFields: Array.isArray(object?.customScalarTypeFields)
        ? object.customScalarTypeFields.map((e: any) => SingleTypeField.fromJSON(e))
        : [],
    };
  },

  toJSON(message: DataSourceCustomGraphQL): unknown {
    const obj: any = {};
    message.fetch !== undefined && (obj.fetch = message.fetch ? FetchConfiguration.toJSON(message.fetch) : undefined);
    message.subscription !== undefined && (obj.subscription = message.subscription
      ? GraphQLSubscriptionConfiguration.toJSON(message.subscription)
      : undefined);
    message.federation !== undefined &&
      (obj.federation = message.federation ? GraphQLFederationConfiguration.toJSON(message.federation) : undefined);
    message.upstreamSchema !== undefined && (obj.upstreamSchema = message.upstreamSchema);
    message.hooksConfiguration !== undefined && (obj.hooksConfiguration = message.hooksConfiguration
      ? GraphQLDataSourceHooksConfiguration.toJSON(message.hooksConfiguration)
      : undefined);
    if (message.customScalarTypeFields) {
      obj.customScalarTypeFields = message.customScalarTypeFields.map((e) => e ? SingleTypeField.toJSON(e) : undefined);
    } else {
      obj.customScalarTypeFields = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DataSourceCustomGraphQL>, I>>(object: I): DataSourceCustomGraphQL {
    const message = createBaseDataSourceCustomGraphQL();
    message.fetch = (object.fetch !== undefined && object.fetch !== null)
      ? FetchConfiguration.fromPartial(object.fetch)
      : undefined;
    message.subscription = (object.subscription !== undefined && object.subscription !== null)
      ? GraphQLSubscriptionConfiguration.fromPartial(object.subscription)
      : undefined;
    message.federation = (object.federation !== undefined && object.federation !== null)
      ? GraphQLFederationConfiguration.fromPartial(object.federation)
      : undefined;
    message.upstreamSchema = object.upstreamSchema ?? "";
    message.hooksConfiguration = (object.hooksConfiguration !== undefined && object.hooksConfiguration !== null)
      ? GraphQLDataSourceHooksConfiguration.fromPartial(object.hooksConfiguration)
      : undefined;
    message.customScalarTypeFields = object.customScalarTypeFields?.map((e) => SingleTypeField.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDataSourceCustomDatabase(): DataSourceCustomDatabase {
  return {
    databaseURL: undefined,
    prismaSchema: "",
    graphqlSchema: "",
    closeTimeoutSeconds: 0,
    jsonTypeFields: [],
    jsonInputVariables: [],
  };
}

export const DataSourceCustomDatabase = {
  fromJSON(object: any): DataSourceCustomDatabase {
    return {
      databaseURL: isSet(object.databaseURL) ? ConfigurationVariable.fromJSON(object.databaseURL) : undefined,
      prismaSchema: isSet(object.prismaSchema) ? String(object.prismaSchema) : "",
      graphqlSchema: isSet(object.graphqlSchema) ? String(object.graphqlSchema) : "",
      closeTimeoutSeconds: isSet(object.closeTimeoutSeconds) ? Number(object.closeTimeoutSeconds) : 0,
      jsonTypeFields: Array.isArray(object?.jsonTypeFields)
        ? object.jsonTypeFields.map((e: any) => SingleTypeField.fromJSON(e))
        : [],
      jsonInputVariables: Array.isArray(object?.jsonInputVariables)
        ? object.jsonInputVariables.map((e: any) => String(e))
        : [],
    };
  },

  toJSON(message: DataSourceCustomDatabase): unknown {
    const obj: any = {};
    message.databaseURL !== undefined &&
      (obj.databaseURL = message.databaseURL ? ConfigurationVariable.toJSON(message.databaseURL) : undefined);
    message.prismaSchema !== undefined && (obj.prismaSchema = message.prismaSchema);
    message.graphqlSchema !== undefined && (obj.graphqlSchema = message.graphqlSchema);
    message.closeTimeoutSeconds !== undefined && (obj.closeTimeoutSeconds = Math.round(message.closeTimeoutSeconds));
    if (message.jsonTypeFields) {
      obj.jsonTypeFields = message.jsonTypeFields.map((e) => e ? SingleTypeField.toJSON(e) : undefined);
    } else {
      obj.jsonTypeFields = [];
    }
    if (message.jsonInputVariables) {
      obj.jsonInputVariables = message.jsonInputVariables.map((e) => e);
    } else {
      obj.jsonInputVariables = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DataSourceCustomDatabase>, I>>(object: I): DataSourceCustomDatabase {
    const message = createBaseDataSourceCustomDatabase();
    message.databaseURL = (object.databaseURL !== undefined && object.databaseURL !== null)
      ? ConfigurationVariable.fromPartial(object.databaseURL)
      : undefined;
    message.prismaSchema = object.prismaSchema ?? "";
    message.graphqlSchema = object.graphqlSchema ?? "";
    message.closeTimeoutSeconds = object.closeTimeoutSeconds ?? 0;
    message.jsonTypeFields = object.jsonTypeFields?.map((e) => SingleTypeField.fromPartial(e)) || [];
    message.jsonInputVariables = object.jsonInputVariables?.map((e) => e) || [];
    return message;
  },
};

function createBaseGraphQLFederationConfiguration(): GraphQLFederationConfiguration {
  return { enabled: false, serviceSdl: "" };
}

export const GraphQLFederationConfiguration = {
  fromJSON(object: any): GraphQLFederationConfiguration {
    return {
      enabled: isSet(object.enabled) ? Boolean(object.enabled) : false,
      serviceSdl: isSet(object.serviceSdl) ? String(object.serviceSdl) : "",
    };
  },

  toJSON(message: GraphQLFederationConfiguration): unknown {
    const obj: any = {};
    message.enabled !== undefined && (obj.enabled = message.enabled);
    message.serviceSdl !== undefined && (obj.serviceSdl = message.serviceSdl);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<GraphQLFederationConfiguration>, I>>(
    object: I,
  ): GraphQLFederationConfiguration {
    const message = createBaseGraphQLFederationConfiguration();
    message.enabled = object.enabled ?? false;
    message.serviceSdl = object.serviceSdl ?? "";
    return message;
  },
};

function createBaseDataSourceCustomStatic(): DataSourceCustomStatic {
  return { data: undefined };
}

export const DataSourceCustomStatic = {
  fromJSON(object: any): DataSourceCustomStatic {
    return { data: isSet(object.data) ? ConfigurationVariable.fromJSON(object.data) : undefined };
  },

  toJSON(message: DataSourceCustomStatic): unknown {
    const obj: any = {};
    message.data !== undefined && (obj.data = message.data ? ConfigurationVariable.toJSON(message.data) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DataSourceCustomStatic>, I>>(object: I): DataSourceCustomStatic {
    const message = createBaseDataSourceCustomStatic();
    message.data = (object.data !== undefined && object.data !== null)
      ? ConfigurationVariable.fromPartial(object.data)
      : undefined;
    return message;
  },
};

function createBaseGraphQLSubscriptionConfiguration(): GraphQLSubscriptionConfiguration {
  return { enabled: false, url: undefined, useSSE: false };
}

export const GraphQLSubscriptionConfiguration = {
  fromJSON(object: any): GraphQLSubscriptionConfiguration {
    return {
      enabled: isSet(object.enabled) ? Boolean(object.enabled) : false,
      url: isSet(object.url) ? ConfigurationVariable.fromJSON(object.url) : undefined,
      useSSE: isSet(object.useSSE) ? Boolean(object.useSSE) : false,
    };
  },

  toJSON(message: GraphQLSubscriptionConfiguration): unknown {
    const obj: any = {};
    message.enabled !== undefined && (obj.enabled = message.enabled);
    message.url !== undefined && (obj.url = message.url ? ConfigurationVariable.toJSON(message.url) : undefined);
    message.useSSE !== undefined && (obj.useSSE = message.useSSE);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<GraphQLSubscriptionConfiguration>, I>>(
    object: I,
  ): GraphQLSubscriptionConfiguration {
    const message = createBaseGraphQLSubscriptionConfiguration();
    message.enabled = object.enabled ?? false;
    message.url = (object.url !== undefined && object.url !== null)
      ? ConfigurationVariable.fromPartial(object.url)
      : undefined;
    message.useSSE = object.useSSE ?? false;
    return message;
  },
};

function createBaseFetchConfiguration(): FetchConfiguration {
  return {
    url: undefined,
    method: 0,
    header: {},
    body: undefined,
    query: [],
    upstreamAuthentication: undefined,
    urlEncodeBody: false,
    mTLS: undefined,
    baseUrl: undefined,
    path: undefined,
    httpProxyUrl: undefined,
  };
}

export const FetchConfiguration = {
  fromJSON(object: any): FetchConfiguration {
    return {
      url: isSet(object.url) ? ConfigurationVariable.fromJSON(object.url) : undefined,
      method: isSet(object.method) ? hTTPMethodFromJSON(object.method) : 0,
      header: isObject(object.header)
        ? Object.entries(object.header).reduce<{ [key: string]: HTTPHeader }>((acc, [key, value]) => {
          acc[key] = HTTPHeader.fromJSON(value);
          return acc;
        }, {})
        : {},
      body: isSet(object.body) ? ConfigurationVariable.fromJSON(object.body) : undefined,
      query: Array.isArray(object?.query)
        ? object.query.map((e: any) => URLQueryConfiguration.fromJSON(e))
        : [],
      upstreamAuthentication: isSet(object.upstreamAuthentication)
        ? UpstreamAuthentication.fromJSON(object.upstreamAuthentication)
        : undefined,
      urlEncodeBody: isSet(object.urlEncodeBody) ? Boolean(object.urlEncodeBody) : false,
      mTLS: isSet(object.mTLS) ? MTLSConfiguration.fromJSON(object.mTLS) : undefined,
      baseUrl: isSet(object.baseUrl) ? ConfigurationVariable.fromJSON(object.baseUrl) : undefined,
      path: isSet(object.path) ? ConfigurationVariable.fromJSON(object.path) : undefined,
      httpProxyUrl: isSet(object.httpProxyUrl) ? ConfigurationVariable.fromJSON(object.httpProxyUrl) : undefined,
    };
  },

  toJSON(message: FetchConfiguration): unknown {
    const obj: any = {};
    message.url !== undefined && (obj.url = message.url ? ConfigurationVariable.toJSON(message.url) : undefined);
    message.method !== undefined && (obj.method = hTTPMethodToJSON(message.method));
    obj.header = {};
    if (message.header) {
      Object.entries(message.header).forEach(([k, v]) => {
        obj.header[k] = HTTPHeader.toJSON(v);
      });
    }
    message.body !== undefined && (obj.body = message.body ? ConfigurationVariable.toJSON(message.body) : undefined);
    if (message.query) {
      obj.query = message.query.map((e) => e ? URLQueryConfiguration.toJSON(e) : undefined);
    } else {
      obj.query = [];
    }
    message.upstreamAuthentication !== undefined && (obj.upstreamAuthentication = message.upstreamAuthentication
      ? UpstreamAuthentication.toJSON(message.upstreamAuthentication)
      : undefined);
    message.urlEncodeBody !== undefined && (obj.urlEncodeBody = message.urlEncodeBody);
    message.mTLS !== undefined && (obj.mTLS = message.mTLS ? MTLSConfiguration.toJSON(message.mTLS) : undefined);
    message.baseUrl !== undefined &&
      (obj.baseUrl = message.baseUrl ? ConfigurationVariable.toJSON(message.baseUrl) : undefined);
    message.path !== undefined && (obj.path = message.path ? ConfigurationVariable.toJSON(message.path) : undefined);
    message.httpProxyUrl !== undefined &&
      (obj.httpProxyUrl = message.httpProxyUrl ? ConfigurationVariable.toJSON(message.httpProxyUrl) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FetchConfiguration>, I>>(object: I): FetchConfiguration {
    const message = createBaseFetchConfiguration();
    message.url = (object.url !== undefined && object.url !== null)
      ? ConfigurationVariable.fromPartial(object.url)
      : undefined;
    message.method = object.method ?? 0;
    message.header = Object.entries(object.header ?? {}).reduce<{ [key: string]: HTTPHeader }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = HTTPHeader.fromPartial(value);
      }
      return acc;
    }, {});
    message.body = (object.body !== undefined && object.body !== null)
      ? ConfigurationVariable.fromPartial(object.body)
      : undefined;
    message.query = object.query?.map((e) => URLQueryConfiguration.fromPartial(e)) || [];
    message.upstreamAuthentication =
      (object.upstreamAuthentication !== undefined && object.upstreamAuthentication !== null)
        ? UpstreamAuthentication.fromPartial(object.upstreamAuthentication)
        : undefined;
    message.urlEncodeBody = object.urlEncodeBody ?? false;
    message.mTLS = (object.mTLS !== undefined && object.mTLS !== null)
      ? MTLSConfiguration.fromPartial(object.mTLS)
      : undefined;
    message.baseUrl = (object.baseUrl !== undefined && object.baseUrl !== null)
      ? ConfigurationVariable.fromPartial(object.baseUrl)
      : undefined;
    message.path = (object.path !== undefined && object.path !== null)
      ? ConfigurationVariable.fromPartial(object.path)
      : undefined;
    message.httpProxyUrl = (object.httpProxyUrl !== undefined && object.httpProxyUrl !== null)
      ? ConfigurationVariable.fromPartial(object.httpProxyUrl)
      : undefined;
    return message;
  },
};

function createBaseFetchConfiguration_HeaderEntry(): FetchConfiguration_HeaderEntry {
  return { key: "", value: undefined };
}

export const FetchConfiguration_HeaderEntry = {
  fromJSON(object: any): FetchConfiguration_HeaderEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? HTTPHeader.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: FetchConfiguration_HeaderEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value ? HTTPHeader.toJSON(message.value) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FetchConfiguration_HeaderEntry>, I>>(
    object: I,
  ): FetchConfiguration_HeaderEntry {
    const message = createBaseFetchConfiguration_HeaderEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? HTTPHeader.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseMTLSConfiguration(): MTLSConfiguration {
  return { key: undefined, cert: undefined, insecureSkipVerify: false };
}

export const MTLSConfiguration = {
  fromJSON(object: any): MTLSConfiguration {
    return {
      key: isSet(object.key) ? ConfigurationVariable.fromJSON(object.key) : undefined,
      cert: isSet(object.cert) ? ConfigurationVariable.fromJSON(object.cert) : undefined,
      insecureSkipVerify: isSet(object.insecureSkipVerify) ? Boolean(object.insecureSkipVerify) : false,
    };
  },

  toJSON(message: MTLSConfiguration): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key ? ConfigurationVariable.toJSON(message.key) : undefined);
    message.cert !== undefined && (obj.cert = message.cert ? ConfigurationVariable.toJSON(message.cert) : undefined);
    message.insecureSkipVerify !== undefined && (obj.insecureSkipVerify = message.insecureSkipVerify);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<MTLSConfiguration>, I>>(object: I): MTLSConfiguration {
    const message = createBaseMTLSConfiguration();
    message.key = (object.key !== undefined && object.key !== null)
      ? ConfigurationVariable.fromPartial(object.key)
      : undefined;
    message.cert = (object.cert !== undefined && object.cert !== null)
      ? ConfigurationVariable.fromPartial(object.cert)
      : undefined;
    message.insecureSkipVerify = object.insecureSkipVerify ?? false;
    return message;
  },
};

function createBaseUpstreamAuthentication(): UpstreamAuthentication {
  return { kind: 0, jwtConfig: undefined, jwtWithAccessTokenExchangeConfig: undefined };
}

export const UpstreamAuthentication = {
  fromJSON(object: any): UpstreamAuthentication {
    return {
      kind: isSet(object.kind) ? upstreamAuthenticationKindFromJSON(object.kind) : 0,
      jwtConfig: isSet(object.jwtConfig) ? JwtUpstreamAuthenticationConfig.fromJSON(object.jwtConfig) : undefined,
      jwtWithAccessTokenExchangeConfig: isSet(object.jwtWithAccessTokenExchangeConfig)
        ? JwtUpstreamAuthenticationWithAccessTokenExchange.fromJSON(object.jwtWithAccessTokenExchangeConfig)
        : undefined,
    };
  },

  toJSON(message: UpstreamAuthentication): unknown {
    const obj: any = {};
    message.kind !== undefined && (obj.kind = upstreamAuthenticationKindToJSON(message.kind));
    message.jwtConfig !== undefined &&
      (obj.jwtConfig = message.jwtConfig ? JwtUpstreamAuthenticationConfig.toJSON(message.jwtConfig) : undefined);
    message.jwtWithAccessTokenExchangeConfig !== undefined &&
      (obj.jwtWithAccessTokenExchangeConfig = message.jwtWithAccessTokenExchangeConfig
        ? JwtUpstreamAuthenticationWithAccessTokenExchange.toJSON(message.jwtWithAccessTokenExchangeConfig)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<UpstreamAuthentication>, I>>(object: I): UpstreamAuthentication {
    const message = createBaseUpstreamAuthentication();
    message.kind = object.kind ?? 0;
    message.jwtConfig = (object.jwtConfig !== undefined && object.jwtConfig !== null)
      ? JwtUpstreamAuthenticationConfig.fromPartial(object.jwtConfig)
      : undefined;
    message.jwtWithAccessTokenExchangeConfig =
      (object.jwtWithAccessTokenExchangeConfig !== undefined && object.jwtWithAccessTokenExchangeConfig !== null)
        ? JwtUpstreamAuthenticationWithAccessTokenExchange.fromPartial(object.jwtWithAccessTokenExchangeConfig)
        : undefined;
    return message;
  },
};

function createBaseJwtUpstreamAuthenticationConfig(): JwtUpstreamAuthenticationConfig {
  return { secret: undefined, signingMethod: 0 };
}

export const JwtUpstreamAuthenticationConfig = {
  fromJSON(object: any): JwtUpstreamAuthenticationConfig {
    return {
      secret: isSet(object.secret) ? ConfigurationVariable.fromJSON(object.secret) : undefined,
      signingMethod: isSet(object.signingMethod) ? signingMethodFromJSON(object.signingMethod) : 0,
    };
  },

  toJSON(message: JwtUpstreamAuthenticationConfig): unknown {
    const obj: any = {};
    message.secret !== undefined &&
      (obj.secret = message.secret ? ConfigurationVariable.toJSON(message.secret) : undefined);
    message.signingMethod !== undefined && (obj.signingMethod = signingMethodToJSON(message.signingMethod));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<JwtUpstreamAuthenticationConfig>, I>>(
    object: I,
  ): JwtUpstreamAuthenticationConfig {
    const message = createBaseJwtUpstreamAuthenticationConfig();
    message.secret = (object.secret !== undefined && object.secret !== null)
      ? ConfigurationVariable.fromPartial(object.secret)
      : undefined;
    message.signingMethod = object.signingMethod ?? 0;
    return message;
  },
};

function createBaseJwtUpstreamAuthenticationWithAccessTokenExchange(): JwtUpstreamAuthenticationWithAccessTokenExchange {
  return { secret: undefined, signingMethod: 0, accessTokenExchangeEndpoint: undefined };
}

export const JwtUpstreamAuthenticationWithAccessTokenExchange = {
  fromJSON(object: any): JwtUpstreamAuthenticationWithAccessTokenExchange {
    return {
      secret: isSet(object.secret) ? ConfigurationVariable.fromJSON(object.secret) : undefined,
      signingMethod: isSet(object.signingMethod) ? signingMethodFromJSON(object.signingMethod) : 0,
      accessTokenExchangeEndpoint: isSet(object.accessTokenExchangeEndpoint)
        ? ConfigurationVariable.fromJSON(object.accessTokenExchangeEndpoint)
        : undefined,
    };
  },

  toJSON(message: JwtUpstreamAuthenticationWithAccessTokenExchange): unknown {
    const obj: any = {};
    message.secret !== undefined &&
      (obj.secret = message.secret ? ConfigurationVariable.toJSON(message.secret) : undefined);
    message.signingMethod !== undefined && (obj.signingMethod = signingMethodToJSON(message.signingMethod));
    message.accessTokenExchangeEndpoint !== undefined &&
      (obj.accessTokenExchangeEndpoint = message.accessTokenExchangeEndpoint
        ? ConfigurationVariable.toJSON(message.accessTokenExchangeEndpoint)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<JwtUpstreamAuthenticationWithAccessTokenExchange>, I>>(
    object: I,
  ): JwtUpstreamAuthenticationWithAccessTokenExchange {
    const message = createBaseJwtUpstreamAuthenticationWithAccessTokenExchange();
    message.secret = (object.secret !== undefined && object.secret !== null)
      ? ConfigurationVariable.fromPartial(object.secret)
      : undefined;
    message.signingMethod = object.signingMethod ?? 0;
    message.accessTokenExchangeEndpoint =
      (object.accessTokenExchangeEndpoint !== undefined && object.accessTokenExchangeEndpoint !== null)
        ? ConfigurationVariable.fromPartial(object.accessTokenExchangeEndpoint)
        : undefined;
    return message;
  },
};

function createBaseRESTSubscriptionConfiguration(): RESTSubscriptionConfiguration {
  return { enabled: false, pollingIntervalMillis: 0, skipPublishSameResponse: false };
}

export const RESTSubscriptionConfiguration = {
  fromJSON(object: any): RESTSubscriptionConfiguration {
    return {
      enabled: isSet(object.enabled) ? Boolean(object.enabled) : false,
      pollingIntervalMillis: isSet(object.pollingIntervalMillis) ? Number(object.pollingIntervalMillis) : 0,
      skipPublishSameResponse: isSet(object.skipPublishSameResponse) ? Boolean(object.skipPublishSameResponse) : false,
    };
  },

  toJSON(message: RESTSubscriptionConfiguration): unknown {
    const obj: any = {};
    message.enabled !== undefined && (obj.enabled = message.enabled);
    message.pollingIntervalMillis !== undefined &&
      (obj.pollingIntervalMillis = Math.round(message.pollingIntervalMillis));
    message.skipPublishSameResponse !== undefined && (obj.skipPublishSameResponse = message.skipPublishSameResponse);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<RESTSubscriptionConfiguration>, I>>(
    object: I,
  ): RESTSubscriptionConfiguration {
    const message = createBaseRESTSubscriptionConfiguration();
    message.enabled = object.enabled ?? false;
    message.pollingIntervalMillis = object.pollingIntervalMillis ?? 0;
    message.skipPublishSameResponse = object.skipPublishSameResponse ?? false;
    return message;
  },
};

function createBaseURLQueryConfiguration(): URLQueryConfiguration {
  return { name: "", value: "" };
}

export const URLQueryConfiguration = {
  fromJSON(object: any): URLQueryConfiguration {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      value: isSet(object.value) ? String(object.value) : "",
    };
  },

  toJSON(message: URLQueryConfiguration): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<URLQueryConfiguration>, I>>(object: I): URLQueryConfiguration {
    const message = createBaseURLQueryConfiguration();
    message.name = object.name ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseHTTPHeader(): HTTPHeader {
  return { values: [] };
}

export const HTTPHeader = {
  fromJSON(object: any): HTTPHeader {
    return {
      values: Array.isArray(object?.values) ? object.values.map((e: any) => ConfigurationVariable.fromJSON(e)) : [],
    };
  },

  toJSON(message: HTTPHeader): unknown {
    const obj: any = {};
    if (message.values) {
      obj.values = message.values.map((e) => e ? ConfigurationVariable.toJSON(e) : undefined);
    } else {
      obj.values = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<HTTPHeader>, I>>(object: I): HTTPHeader {
    const message = createBaseHTTPHeader();
    message.values = object.values?.map((e) => ConfigurationVariable.fromPartial(e)) || [];
    return message;
  },
};

function createBaseTypeConfiguration(): TypeConfiguration {
  return { typeName: "", renameTo: "" };
}

export const TypeConfiguration = {
  fromJSON(object: any): TypeConfiguration {
    return {
      typeName: isSet(object.typeName) ? String(object.typeName) : "",
      renameTo: isSet(object.renameTo) ? String(object.renameTo) : "",
    };
  },

  toJSON(message: TypeConfiguration): unknown {
    const obj: any = {};
    message.typeName !== undefined && (obj.typeName = message.typeName);
    message.renameTo !== undefined && (obj.renameTo = message.renameTo);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TypeConfiguration>, I>>(object: I): TypeConfiguration {
    const message = createBaseTypeConfiguration();
    message.typeName = object.typeName ?? "";
    message.renameTo = object.renameTo ?? "";
    return message;
  },
};

function createBaseFieldConfiguration(): FieldConfiguration {
  return {
    typeName: "",
    fieldName: "",
    disableDefaultFieldMapping: false,
    path: [],
    argumentsConfiguration: [],
    requiresFields: [],
    unescapeResponseJson: false,
  };
}

export const FieldConfiguration = {
  fromJSON(object: any): FieldConfiguration {
    return {
      typeName: isSet(object.typeName) ? String(object.typeName) : "",
      fieldName: isSet(object.fieldName) ? String(object.fieldName) : "",
      disableDefaultFieldMapping: isSet(object.disableDefaultFieldMapping)
        ? Boolean(object.disableDefaultFieldMapping)
        : false,
      path: Array.isArray(object?.path)
        ? object.path.map((e: any) => String(e))
        : [],
      argumentsConfiguration: Array.isArray(object?.argumentsConfiguration)
        ? object.argumentsConfiguration.map((e: any) => ArgumentConfiguration.fromJSON(e))
        : [],
      requiresFields: Array.isArray(object?.requiresFields)
        ? object.requiresFields.map((e: any) => String(e))
        : [],
      unescapeResponseJson: isSet(object.unescapeResponseJson) ? Boolean(object.unescapeResponseJson) : false,
    };
  },

  toJSON(message: FieldConfiguration): unknown {
    const obj: any = {};
    message.typeName !== undefined && (obj.typeName = message.typeName);
    message.fieldName !== undefined && (obj.fieldName = message.fieldName);
    message.disableDefaultFieldMapping !== undefined &&
      (obj.disableDefaultFieldMapping = message.disableDefaultFieldMapping);
    if (message.path) {
      obj.path = message.path.map((e) => e);
    } else {
      obj.path = [];
    }
    if (message.argumentsConfiguration) {
      obj.argumentsConfiguration = message.argumentsConfiguration.map((e) =>
        e ? ArgumentConfiguration.toJSON(e) : undefined
      );
    } else {
      obj.argumentsConfiguration = [];
    }
    if (message.requiresFields) {
      obj.requiresFields = message.requiresFields.map((e) => e);
    } else {
      obj.requiresFields = [];
    }
    message.unescapeResponseJson !== undefined && (obj.unescapeResponseJson = message.unescapeResponseJson);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FieldConfiguration>, I>>(object: I): FieldConfiguration {
    const message = createBaseFieldConfiguration();
    message.typeName = object.typeName ?? "";
    message.fieldName = object.fieldName ?? "";
    message.disableDefaultFieldMapping = object.disableDefaultFieldMapping ?? false;
    message.path = object.path?.map((e) => e) || [];
    message.argumentsConfiguration = object.argumentsConfiguration?.map((e) => ArgumentConfiguration.fromPartial(e)) ||
      [];
    message.requiresFields = object.requiresFields?.map((e) => e) || [];
    message.unescapeResponseJson = object.unescapeResponseJson ?? false;
    return message;
  },
};

function createBaseTypeField(): TypeField {
  return { typeName: "", fieldNames: [] };
}

export const TypeField = {
  fromJSON(object: any): TypeField {
    return {
      typeName: isSet(object.typeName) ? String(object.typeName) : "",
      fieldNames: Array.isArray(object?.fieldNames) ? object.fieldNames.map((e: any) => String(e)) : [],
    };
  },

  toJSON(message: TypeField): unknown {
    const obj: any = {};
    message.typeName !== undefined && (obj.typeName = message.typeName);
    if (message.fieldNames) {
      obj.fieldNames = message.fieldNames.map((e) => e);
    } else {
      obj.fieldNames = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TypeField>, I>>(object: I): TypeField {
    const message = createBaseTypeField();
    message.typeName = object.typeName ?? "";
    message.fieldNames = object.fieldNames?.map((e) => e) || [];
    return message;
  },
};

function createBaseSingleTypeField(): SingleTypeField {
  return { typeName: "", fieldName: "" };
}

export const SingleTypeField = {
  fromJSON(object: any): SingleTypeField {
    return {
      typeName: isSet(object.typeName) ? String(object.typeName) : "",
      fieldName: isSet(object.fieldName) ? String(object.fieldName) : "",
    };
  },

  toJSON(message: SingleTypeField): unknown {
    const obj: any = {};
    message.typeName !== undefined && (obj.typeName = message.typeName);
    message.fieldName !== undefined && (obj.fieldName = message.fieldName);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SingleTypeField>, I>>(object: I): SingleTypeField {
    const message = createBaseSingleTypeField();
    message.typeName = object.typeName ?? "";
    message.fieldName = object.fieldName ?? "";
    return message;
  },
};

function createBaseArgumentConfiguration(): ArgumentConfiguration {
  return { name: "", sourceType: 0, sourcePath: [], renderConfiguration: 0, renameTypeTo: "" };
}

export const ArgumentConfiguration = {
  fromJSON(object: any): ArgumentConfiguration {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      sourceType: isSet(object.sourceType) ? argumentSourceFromJSON(object.sourceType) : 0,
      sourcePath: Array.isArray(object?.sourcePath) ? object.sourcePath.map((e: any) => String(e)) : [],
      renderConfiguration: isSet(object.renderConfiguration)
        ? argumentRenderConfigurationFromJSON(object.renderConfiguration)
        : 0,
      renameTypeTo: isSet(object.renameTypeTo) ? String(object.renameTypeTo) : "",
    };
  },

  toJSON(message: ArgumentConfiguration): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.sourceType !== undefined && (obj.sourceType = argumentSourceToJSON(message.sourceType));
    if (message.sourcePath) {
      obj.sourcePath = message.sourcePath.map((e) => e);
    } else {
      obj.sourcePath = [];
    }
    message.renderConfiguration !== undefined &&
      (obj.renderConfiguration = argumentRenderConfigurationToJSON(message.renderConfiguration));
    message.renameTypeTo !== undefined && (obj.renameTypeTo = message.renameTypeTo);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ArgumentConfiguration>, I>>(object: I): ArgumentConfiguration {
    const message = createBaseArgumentConfiguration();
    message.name = object.name ?? "";
    message.sourceType = object.sourceType ?? 0;
    message.sourcePath = object.sourcePath?.map((e) => e) || [];
    message.renderConfiguration = object.renderConfiguration ?? 0;
    message.renameTypeTo = object.renameTypeTo ?? "";
    return message;
  },
};

function createBaseWunderGraphConfiguration(): WunderGraphConfiguration {
  return { api: undefined, apiId: "", environmentIds: [], dangerouslyEnableGraphQLEndpoint: false, configHash: "" };
}

export const WunderGraphConfiguration = {
  fromJSON(object: any): WunderGraphConfiguration {
    return {
      api: isSet(object.api) ? UserDefinedApi.fromJSON(object.api) : undefined,
      apiId: isSet(object.apiId) ? String(object.apiId) : "",
      environmentIds: Array.isArray(object?.environmentIds) ? object.environmentIds.map((e: any) => String(e)) : [],
      dangerouslyEnableGraphQLEndpoint: isSet(object.dangerouslyEnableGraphQLEndpoint)
        ? Boolean(object.dangerouslyEnableGraphQLEndpoint)
        : false,
      configHash: isSet(object.configHash) ? String(object.configHash) : "",
    };
  },

  toJSON(message: WunderGraphConfiguration): unknown {
    const obj: any = {};
    message.api !== undefined && (obj.api = message.api ? UserDefinedApi.toJSON(message.api) : undefined);
    message.apiId !== undefined && (obj.apiId = message.apiId);
    if (message.environmentIds) {
      obj.environmentIds = message.environmentIds.map((e) => e);
    } else {
      obj.environmentIds = [];
    }
    message.dangerouslyEnableGraphQLEndpoint !== undefined &&
      (obj.dangerouslyEnableGraphQLEndpoint = message.dangerouslyEnableGraphQLEndpoint);
    message.configHash !== undefined && (obj.configHash = message.configHash);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<WunderGraphConfiguration>, I>>(object: I): WunderGraphConfiguration {
    const message = createBaseWunderGraphConfiguration();
    message.api = (object.api !== undefined && object.api !== null)
      ? UserDefinedApi.fromPartial(object.api)
      : undefined;
    message.apiId = object.apiId ?? "";
    message.environmentIds = object.environmentIds?.map((e) => e) || [];
    message.dangerouslyEnableGraphQLEndpoint = object.dangerouslyEnableGraphQLEndpoint ?? false;
    message.configHash = object.configHash ?? "";
    return message;
  },
};

function createBaseS3UploadProfileHooksConfiguration(): S3UploadProfileHooksConfiguration {
  return { preUpload: false, postUpload: false };
}

export const S3UploadProfileHooksConfiguration = {
  fromJSON(object: any): S3UploadProfileHooksConfiguration {
    return {
      preUpload: isSet(object.preUpload) ? Boolean(object.preUpload) : false,
      postUpload: isSet(object.postUpload) ? Boolean(object.postUpload) : false,
    };
  },

  toJSON(message: S3UploadProfileHooksConfiguration): unknown {
    const obj: any = {};
    message.preUpload !== undefined && (obj.preUpload = message.preUpload);
    message.postUpload !== undefined && (obj.postUpload = message.postUpload);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<S3UploadProfileHooksConfiguration>, I>>(
    object: I,
  ): S3UploadProfileHooksConfiguration {
    const message = createBaseS3UploadProfileHooksConfiguration();
    message.preUpload = object.preUpload ?? false;
    message.postUpload = object.postUpload ?? false;
    return message;
  },
};

function createBaseS3UploadProfile(): S3UploadProfile {
  return {
    requireAuthentication: false,
    maxAllowedUploadSizeBytes: 0,
    maxAllowedFiles: 0,
    allowedMimeTypes: [],
    allowedFileExtensions: [],
    metadataJSONSchema: "",
    hooks: undefined,
  };
}

export const S3UploadProfile = {
  fromJSON(object: any): S3UploadProfile {
    return {
      requireAuthentication: isSet(object.requireAuthentication) ? Boolean(object.requireAuthentication) : false,
      maxAllowedUploadSizeBytes: isSet(object.maxAllowedUploadSizeBytes) ? Number(object.maxAllowedUploadSizeBytes) : 0,
      maxAllowedFiles: isSet(object.maxAllowedFiles) ? Number(object.maxAllowedFiles) : 0,
      allowedMimeTypes: Array.isArray(object?.allowedMimeTypes)
        ? object.allowedMimeTypes.map((e: any) => String(e))
        : [],
      allowedFileExtensions: Array.isArray(object?.allowedFileExtensions)
        ? object.allowedFileExtensions.map((e: any) => String(e))
        : [],
      metadataJSONSchema: isSet(object.metadataJSONSchema) ? String(object.metadataJSONSchema) : "",
      hooks: isSet(object.hooks) ? S3UploadProfileHooksConfiguration.fromJSON(object.hooks) : undefined,
    };
  },

  toJSON(message: S3UploadProfile): unknown {
    const obj: any = {};
    message.requireAuthentication !== undefined && (obj.requireAuthentication = message.requireAuthentication);
    message.maxAllowedUploadSizeBytes !== undefined &&
      (obj.maxAllowedUploadSizeBytes = Math.round(message.maxAllowedUploadSizeBytes));
    message.maxAllowedFiles !== undefined && (obj.maxAllowedFiles = Math.round(message.maxAllowedFiles));
    if (message.allowedMimeTypes) {
      obj.allowedMimeTypes = message.allowedMimeTypes.map((e) => e);
    } else {
      obj.allowedMimeTypes = [];
    }
    if (message.allowedFileExtensions) {
      obj.allowedFileExtensions = message.allowedFileExtensions.map((e) => e);
    } else {
      obj.allowedFileExtensions = [];
    }
    message.metadataJSONSchema !== undefined && (obj.metadataJSONSchema = message.metadataJSONSchema);
    message.hooks !== undefined &&
      (obj.hooks = message.hooks ? S3UploadProfileHooksConfiguration.toJSON(message.hooks) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<S3UploadProfile>, I>>(object: I): S3UploadProfile {
    const message = createBaseS3UploadProfile();
    message.requireAuthentication = object.requireAuthentication ?? false;
    message.maxAllowedUploadSizeBytes = object.maxAllowedUploadSizeBytes ?? 0;
    message.maxAllowedFiles = object.maxAllowedFiles ?? 0;
    message.allowedMimeTypes = object.allowedMimeTypes?.map((e) => e) || [];
    message.allowedFileExtensions = object.allowedFileExtensions?.map((e) => e) || [];
    message.metadataJSONSchema = object.metadataJSONSchema ?? "";
    message.hooks = (object.hooks !== undefined && object.hooks !== null)
      ? S3UploadProfileHooksConfiguration.fromPartial(object.hooks)
      : undefined;
    return message;
  },
};

function createBaseS3UploadConfiguration(): S3UploadConfiguration {
  return {
    name: "",
    endpoint: undefined,
    accessKeyID: undefined,
    secretAccessKey: undefined,
    bucketName: undefined,
    bucketLocation: undefined,
    useSSL: false,
    uploadProfiles: {},
  };
}

export const S3UploadConfiguration = {
  fromJSON(object: any): S3UploadConfiguration {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      endpoint: isSet(object.endpoint) ? ConfigurationVariable.fromJSON(object.endpoint) : undefined,
      accessKeyID: isSet(object.accessKeyID) ? ConfigurationVariable.fromJSON(object.accessKeyID) : undefined,
      secretAccessKey: isSet(object.secretAccessKey)
        ? ConfigurationVariable.fromJSON(object.secretAccessKey)
        : undefined,
      bucketName: isSet(object.bucketName) ? ConfigurationVariable.fromJSON(object.bucketName) : undefined,
      bucketLocation: isSet(object.bucketLocation) ? ConfigurationVariable.fromJSON(object.bucketLocation) : undefined,
      useSSL: isSet(object.useSSL) ? Boolean(object.useSSL) : false,
      uploadProfiles: isObject(object.uploadProfiles)
        ? Object.entries(object.uploadProfiles).reduce<{ [key: string]: S3UploadProfile }>((acc, [key, value]) => {
          acc[key] = S3UploadProfile.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: S3UploadConfiguration): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.endpoint !== undefined &&
      (obj.endpoint = message.endpoint ? ConfigurationVariable.toJSON(message.endpoint) : undefined);
    message.accessKeyID !== undefined &&
      (obj.accessKeyID = message.accessKeyID ? ConfigurationVariable.toJSON(message.accessKeyID) : undefined);
    message.secretAccessKey !== undefined &&
      (obj.secretAccessKey = message.secretAccessKey
        ? ConfigurationVariable.toJSON(message.secretAccessKey)
        : undefined);
    message.bucketName !== undefined &&
      (obj.bucketName = message.bucketName ? ConfigurationVariable.toJSON(message.bucketName) : undefined);
    message.bucketLocation !== undefined &&
      (obj.bucketLocation = message.bucketLocation ? ConfigurationVariable.toJSON(message.bucketLocation) : undefined);
    message.useSSL !== undefined && (obj.useSSL = message.useSSL);
    obj.uploadProfiles = {};
    if (message.uploadProfiles) {
      Object.entries(message.uploadProfiles).forEach(([k, v]) => {
        obj.uploadProfiles[k] = S3UploadProfile.toJSON(v);
      });
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<S3UploadConfiguration>, I>>(object: I): S3UploadConfiguration {
    const message = createBaseS3UploadConfiguration();
    message.name = object.name ?? "";
    message.endpoint = (object.endpoint !== undefined && object.endpoint !== null)
      ? ConfigurationVariable.fromPartial(object.endpoint)
      : undefined;
    message.accessKeyID = (object.accessKeyID !== undefined && object.accessKeyID !== null)
      ? ConfigurationVariable.fromPartial(object.accessKeyID)
      : undefined;
    message.secretAccessKey = (object.secretAccessKey !== undefined && object.secretAccessKey !== null)
      ? ConfigurationVariable.fromPartial(object.secretAccessKey)
      : undefined;
    message.bucketName = (object.bucketName !== undefined && object.bucketName !== null)
      ? ConfigurationVariable.fromPartial(object.bucketName)
      : undefined;
    message.bucketLocation = (object.bucketLocation !== undefined && object.bucketLocation !== null)
      ? ConfigurationVariable.fromPartial(object.bucketLocation)
      : undefined;
    message.useSSL = object.useSSL ?? false;
    message.uploadProfiles = Object.entries(object.uploadProfiles ?? {}).reduce<{ [key: string]: S3UploadProfile }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = S3UploadProfile.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseS3UploadConfiguration_UploadProfilesEntry(): S3UploadConfiguration_UploadProfilesEntry {
  return { key: "", value: undefined };
}

export const S3UploadConfiguration_UploadProfilesEntry = {
  fromJSON(object: any): S3UploadConfiguration_UploadProfilesEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? S3UploadProfile.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: S3UploadConfiguration_UploadProfilesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value ? S3UploadProfile.toJSON(message.value) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<S3UploadConfiguration_UploadProfilesEntry>, I>>(
    object: I,
  ): S3UploadConfiguration_UploadProfilesEntry {
    const message = createBaseS3UploadConfiguration_UploadProfilesEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? S3UploadProfile.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseUserDefinedApi(): UserDefinedApi {
  return {
    engineConfiguration: undefined,
    enableGraphqlEndpoint: false,
    operations: [],
    invalidOperationNames: [],
    corsConfiguration: undefined,
    authenticationConfig: undefined,
    s3UploadConfiguration: [],
    allowedHostNames: [],
    webhooks: [],
    serverOptions: undefined,
    nodeOptions: undefined,
    experimentalConfig: undefined
  };
}

export const UserDefinedApi = {
  fromJSON(object: any): UserDefinedApi {
    return {
      engineConfiguration: isSet(object.engineConfiguration)
        ? EngineConfiguration.fromJSON(object.engineConfiguration)
        : undefined,
      enableGraphqlEndpoint: isSet(object.enableGraphqlEndpoint) ? Boolean(object.enableGraphqlEndpoint) : false,
      operations: Array.isArray(object?.operations) ? object.operations.map((e: any) => Operation.fromJSON(e)) : [],
      invalidOperationNames: Array.isArray(object?.invalidOperationNames)
        ? object.invalidOperationNames.map((e: any) => String(e))
        : [],
      corsConfiguration: isSet(object.corsConfiguration)
        ? CorsConfiguration.fromJSON(object.corsConfiguration)
        : undefined,
      authenticationConfig: isSet(object.authenticationConfig)
        ? ApiAuthenticationConfig.fromJSON(object.authenticationConfig)
        : undefined,
      s3UploadConfiguration: Array.isArray(object?.s3UploadConfiguration)
        ? object.s3UploadConfiguration.map((e: any) => S3UploadConfiguration.fromJSON(e))
        : [],
      allowedHostNames: Array.isArray(object?.allowedHostNames)
        ? object.allowedHostNames.map((e: any) => ConfigurationVariable.fromJSON(e))
        : [],
      webhooks: Array.isArray(object?.webhooks)
        ? object.webhooks.map((e: any) => WebhookConfiguration.fromJSON(e))
        : [],
      serverOptions: isSet(object.serverOptions) ? ServerOptions.fromJSON(object.serverOptions) : undefined,
      nodeOptions: isSet(object.nodeOptions) ? NodeOptions.fromJSON(object.nodeOptions) : undefined,
      experimentalConfig: isSet(object.experimentalConfig) ? ExperimentalConfig.fromJSON(object) : undefined
    };
  },

  toJSON(message: UserDefinedApi): unknown {
    const obj: any = {};
    message.engineConfiguration !== undefined && (obj.engineConfiguration = message.engineConfiguration
      ? EngineConfiguration.toJSON(message.engineConfiguration)
      : undefined);
    message.enableGraphqlEndpoint !== undefined && (obj.enableGraphqlEndpoint = message.enableGraphqlEndpoint);
    if (message.operations) {
      obj.operations = message.operations.map((e) => e ? Operation.toJSON(e) : undefined);
    } else {
      obj.operations = [];
    }
    if (message.invalidOperationNames) {
      obj.invalidOperationNames = message.invalidOperationNames.map((e) => e);
    } else {
      obj.invalidOperationNames = [];
    }
    message.corsConfiguration !== undefined && (obj.corsConfiguration = message.corsConfiguration
      ? CorsConfiguration.toJSON(message.corsConfiguration)
      : undefined);
    message.authenticationConfig !== undefined && (obj.authenticationConfig = message.authenticationConfig
      ? ApiAuthenticationConfig.toJSON(message.authenticationConfig)
      : undefined);
    if (message.s3UploadConfiguration) {
      obj.s3UploadConfiguration = message.s3UploadConfiguration.map((e) =>
        e ? S3UploadConfiguration.toJSON(e) : undefined
      );
    } else {
      obj.s3UploadConfiguration = [];
    }
    if (message.allowedHostNames) {
      obj.allowedHostNames = message.allowedHostNames.map((e) => e ? ConfigurationVariable.toJSON(e) : undefined);
    } else {
      obj.allowedHostNames = [];
    }
    if (message.webhooks) {
      obj.webhooks = message.webhooks.map((e) => e ? WebhookConfiguration.toJSON(e) : undefined);
    } else {
      obj.webhooks = [];
    }
    message.serverOptions !== undefined &&
      (obj.serverOptions = message.serverOptions ? ServerOptions.toJSON(message.serverOptions) : undefined);
    message.nodeOptions !== undefined &&
      (obj.nodeOptions = message.nodeOptions ? NodeOptions.toJSON(message.nodeOptions) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<UserDefinedApi>, I>>(object: I): UserDefinedApi {
    const message = createBaseUserDefinedApi();
    message.engineConfiguration = (object.engineConfiguration !== undefined && object.engineConfiguration !== null)
      ? EngineConfiguration.fromPartial(object.engineConfiguration)
      : undefined;
    message.enableGraphqlEndpoint = object.enableGraphqlEndpoint ?? false;
    message.operations = object.operations?.map((e) => Operation.fromPartial(e)) || [];
    message.invalidOperationNames = object.invalidOperationNames?.map((e) => e) || [];
    message.corsConfiguration = (object.corsConfiguration !== undefined && object.corsConfiguration !== null)
      ? CorsConfiguration.fromPartial(object.corsConfiguration)
      : undefined;
    message.authenticationConfig = (object.authenticationConfig !== undefined && object.authenticationConfig !== null)
      ? ApiAuthenticationConfig.fromPartial(object.authenticationConfig)
      : undefined;
    message.s3UploadConfiguration = object.s3UploadConfiguration?.map((e) => S3UploadConfiguration.fromPartial(e)) ||
      [];
    message.allowedHostNames = object.allowedHostNames?.map((e) => ConfigurationVariable.fromPartial(e)) || [];
    message.webhooks = object.webhooks?.map((e) => WebhookConfiguration.fromPartial(e)) || [];
    message.serverOptions = (object.serverOptions !== undefined && object.serverOptions !== null)
      ? ServerOptions.fromPartial(object.serverOptions)
      : undefined;
    message.nodeOptions = (object.nodeOptions !== undefined && object.nodeOptions !== null)
      ? NodeOptions.fromPartial(object.nodeOptions)
      : undefined;
    return message;
  },
};

function createBaseListenerOptions(): ListenerOptions {
  return { host: undefined, port: undefined };
}

export const ListenerOptions = {
  fromJSON(object: any): ListenerOptions {
    return {
      host: isSet(object.host) ? ConfigurationVariable.fromJSON(object.host) : undefined,
      port: isSet(object.port) ? ConfigurationVariable.fromJSON(object.port) : undefined,
    };
  },

  toJSON(message: ListenerOptions): unknown {
    const obj: any = {};
    message.host !== undefined && (obj.host = message.host ? ConfigurationVariable.toJSON(message.host) : undefined);
    message.port !== undefined && (obj.port = message.port ? ConfigurationVariable.toJSON(message.port) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ListenerOptions>, I>>(object: I): ListenerOptions {
    const message = createBaseListenerOptions();
    message.host = (object.host !== undefined && object.host !== null)
      ? ConfigurationVariable.fromPartial(object.host)
      : undefined;
    message.port = (object.port !== undefined && object.port !== null)
      ? ConfigurationVariable.fromPartial(object.port)
      : undefined;
    return message;
  },
};

function createBaseInternalListenerOptions(): InternalListenerOptions {
  return { port: undefined };
}

export const InternalListenerOptions = {
  fromJSON(object: any): InternalListenerOptions {
    return { port: isSet(object.port) ? ConfigurationVariable.fromJSON(object.port) : undefined };
  },

  toJSON(message: InternalListenerOptions): unknown {
    const obj: any = {};
    message.port !== undefined && (obj.port = message.port ? ConfigurationVariable.toJSON(message.port) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<InternalListenerOptions>, I>>(object: I): InternalListenerOptions {
    const message = createBaseInternalListenerOptions();
    message.port = (object.port !== undefined && object.port !== null)
      ? ConfigurationVariable.fromPartial(object.port)
      : undefined;
    return message;
  },
};

function createBaseNodeLogging(): NodeLogging {
  return { level: undefined };
}

export const NodeLogging = {
  fromJSON(object: any): NodeLogging {
    return { level: isSet(object.level) ? ConfigurationVariable.fromJSON(object.level) : undefined };
  },

  toJSON(message: NodeLogging): unknown {
    const obj: any = {};
    message.level !== undefined &&
      (obj.level = message.level ? ConfigurationVariable.toJSON(message.level) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<NodeLogging>, I>>(object: I): NodeLogging {
    const message = createBaseNodeLogging();
    message.level = (object.level !== undefined && object.level !== null)
      ? ConfigurationVariable.fromPartial(object.level)
      : undefined;
    return message;
  },
};

function createBaseNodeOptions(): NodeOptions {
  return {
    nodeUrl: undefined,
    publicNodeUrl: undefined,
    listen: undefined,
    logger: undefined,
    defaultRequestTimeoutSeconds: 0,
    listenInternal: undefined,
    nodeInternalUrl: undefined,
    defaultHttpProxyUrl: undefined,
  };
}

export const NodeOptions = {
  fromJSON(object: any): NodeOptions {
    return {
      nodeUrl: isSet(object.nodeUrl) ? ConfigurationVariable.fromJSON(object.nodeUrl) : undefined,
      publicNodeUrl: isSet(object.publicNodeUrl) ? ConfigurationVariable.fromJSON(object.publicNodeUrl) : undefined,
      listen: isSet(object.listen) ? ListenerOptions.fromJSON(object.listen) : undefined,
      logger: isSet(object.logger) ? NodeLogging.fromJSON(object.logger) : undefined,
      defaultRequestTimeoutSeconds: isSet(object.defaultRequestTimeoutSeconds)
        ? Number(object.defaultRequestTimeoutSeconds)
        : 0,
      listenInternal: isSet(object.listenInternal)
        ? InternalListenerOptions.fromJSON(object.listenInternal)
        : undefined,
      nodeInternalUrl: isSet(object.nodeInternalUrl)
        ? ConfigurationVariable.fromJSON(object.nodeInternalUrl)
        : undefined,
      defaultHttpProxyUrl: isSet(object.defaultHttpProxyUrl)
        ? ConfigurationVariable.fromJSON(object.defaultHttpProxyUrl)
        : undefined,
    };
  },

  toJSON(message: NodeOptions): unknown {
    const obj: any = {};
    message.nodeUrl !== undefined &&
      (obj.nodeUrl = message.nodeUrl ? ConfigurationVariable.toJSON(message.nodeUrl) : undefined);
    message.publicNodeUrl !== undefined &&
      (obj.publicNodeUrl = message.publicNodeUrl ? ConfigurationVariable.toJSON(message.publicNodeUrl) : undefined);
    message.listen !== undefined && (obj.listen = message.listen ? ListenerOptions.toJSON(message.listen) : undefined);
    message.logger !== undefined && (obj.logger = message.logger ? NodeLogging.toJSON(message.logger) : undefined);
    message.defaultRequestTimeoutSeconds !== undefined &&
      (obj.defaultRequestTimeoutSeconds = Math.round(message.defaultRequestTimeoutSeconds));
    message.listenInternal !== undefined &&
      (obj.listenInternal = message.listenInternal
        ? InternalListenerOptions.toJSON(message.listenInternal)
        : undefined);
    message.nodeInternalUrl !== undefined &&
      (obj.nodeInternalUrl = message.nodeInternalUrl
        ? ConfigurationVariable.toJSON(message.nodeInternalUrl)
        : undefined);
    message.defaultHttpProxyUrl !== undefined && (obj.defaultHttpProxyUrl = message.defaultHttpProxyUrl
      ? ConfigurationVariable.toJSON(message.defaultHttpProxyUrl)
      : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<NodeOptions>, I>>(object: I): NodeOptions {
    const message = createBaseNodeOptions();
    message.nodeUrl = (object.nodeUrl !== undefined && object.nodeUrl !== null)
      ? ConfigurationVariable.fromPartial(object.nodeUrl)
      : undefined;
    message.publicNodeUrl = (object.publicNodeUrl !== undefined && object.publicNodeUrl !== null)
      ? ConfigurationVariable.fromPartial(object.publicNodeUrl)
      : undefined;
    message.listen = (object.listen !== undefined && object.listen !== null)
      ? ListenerOptions.fromPartial(object.listen)
      : undefined;
    message.logger = (object.logger !== undefined && object.logger !== null)
      ? NodeLogging.fromPartial(object.logger)
      : undefined;
    message.defaultRequestTimeoutSeconds = object.defaultRequestTimeoutSeconds ?? 0;
    message.listenInternal = (object.listenInternal !== undefined && object.listenInternal !== null)
      ? InternalListenerOptions.fromPartial(object.listenInternal)
      : undefined;
    message.nodeInternalUrl = (object.nodeInternalUrl !== undefined && object.nodeInternalUrl !== null)
      ? ConfigurationVariable.fromPartial(object.nodeInternalUrl)
      : undefined;
    message.defaultHttpProxyUrl = (object.defaultHttpProxyUrl !== undefined && object.defaultHttpProxyUrl !== null)
      ? ConfigurationVariable.fromPartial(object.defaultHttpProxyUrl)
      : undefined;
    return message;
  },
};

function createBaseServerLogging(): ServerLogging {
  return { level: undefined };
}

export const ServerLogging = {
  fromJSON(object: any): ServerLogging {
    return { level: isSet(object.level) ? ConfigurationVariable.fromJSON(object.level) : undefined };
  },

  toJSON(message: ServerLogging): unknown {
    const obj: any = {};
    message.level !== undefined &&
      (obj.level = message.level ? ConfigurationVariable.toJSON(message.level) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ServerLogging>, I>>(object: I): ServerLogging {
    const message = createBaseServerLogging();
    message.level = (object.level !== undefined && object.level !== null)
      ? ConfigurationVariable.fromPartial(object.level)
      : undefined;
    return message;
  },
};

function createBaseServerOptions(): ServerOptions {
  return { serverUrl: undefined, listen: undefined, logger: undefined };
}

export const ServerOptions = {
  fromJSON(object: any): ServerOptions {
    return {
      serverUrl: isSet(object.serverUrl) ? ConfigurationVariable.fromJSON(object.serverUrl) : undefined,
      listen: isSet(object.listen) ? ListenerOptions.fromJSON(object.listen) : undefined,
      logger: isSet(object.logger) ? ServerLogging.fromJSON(object.logger) : undefined,
    };
  },

  toJSON(message: ServerOptions): unknown {
    const obj: any = {};
    message.serverUrl !== undefined &&
      (obj.serverUrl = message.serverUrl ? ConfigurationVariable.toJSON(message.serverUrl) : undefined);
    message.listen !== undefined && (obj.listen = message.listen ? ListenerOptions.toJSON(message.listen) : undefined);
    message.logger !== undefined && (obj.logger = message.logger ? ServerLogging.toJSON(message.logger) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ServerOptions>, I>>(object: I): ServerOptions {
    const message = createBaseServerOptions();
    message.serverUrl = (object.serverUrl !== undefined && object.serverUrl !== null)
      ? ConfigurationVariable.fromPartial(object.serverUrl)
      : undefined;
    message.listen = (object.listen !== undefined && object.listen !== null)
      ? ListenerOptions.fromPartial(object.listen)
      : undefined;
    message.logger = (object.logger !== undefined && object.logger !== null)
      ? ServerLogging.fromPartial(object.logger)
      : undefined;
    return message;
  },
};

function createBaseWebhookConfiguration(): WebhookConfiguration {
  return { name: "", filePath: "", verifier: undefined };
}

export const WebhookConfiguration = {
  fromJSON(object: any): WebhookConfiguration {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      filePath: isSet(object.filePath) ? String(object.filePath) : "",
      verifier: isSet(object.verifier) ? WebhookVerifier.fromJSON(object.verifier) : undefined,
    };
  },

  toJSON(message: WebhookConfiguration): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.filePath !== undefined && (obj.filePath = message.filePath);
    message.verifier !== undefined &&
      (obj.verifier = message.verifier ? WebhookVerifier.toJSON(message.verifier) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<WebhookConfiguration>, I>>(object: I): WebhookConfiguration {
    const message = createBaseWebhookConfiguration();
    message.name = object.name ?? "";
    message.filePath = object.filePath ?? "";
    message.verifier = (object.verifier !== undefined && object.verifier !== null)
      ? WebhookVerifier.fromPartial(object.verifier)
      : undefined;
    return message;
  },
};

function createBaseWebhookVerifier(): WebhookVerifier {
  return { kind: 0, secret: undefined, signatureHeader: "", signatureHeaderPrefix: "" };
}

export const WebhookVerifier = {
  fromJSON(object: any): WebhookVerifier {
    return {
      kind: isSet(object.kind) ? webhookVerifierKindFromJSON(object.kind) : 0,
      secret: isSet(object.secret) ? ConfigurationVariable.fromJSON(object.secret) : undefined,
      signatureHeader: isSet(object.signatureHeader) ? String(object.signatureHeader) : "",
      signatureHeaderPrefix: isSet(object.signatureHeaderPrefix) ? String(object.signatureHeaderPrefix) : "",
    };
  },

  toJSON(message: WebhookVerifier): unknown {
    const obj: any = {};
    message.kind !== undefined && (obj.kind = webhookVerifierKindToJSON(message.kind));
    message.secret !== undefined &&
      (obj.secret = message.secret ? ConfigurationVariable.toJSON(message.secret) : undefined);
    message.signatureHeader !== undefined && (obj.signatureHeader = message.signatureHeader);
    message.signatureHeaderPrefix !== undefined && (obj.signatureHeaderPrefix = message.signatureHeaderPrefix);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<WebhookVerifier>, I>>(object: I): WebhookVerifier {
    const message = createBaseWebhookVerifier();
    message.kind = object.kind ?? 0;
    message.secret = (object.secret !== undefined && object.secret !== null)
      ? ConfigurationVariable.fromPartial(object.secret)
      : undefined;
    message.signatureHeader = object.signatureHeader ?? "";
    message.signatureHeaderPrefix = object.signatureHeaderPrefix ?? "";
    return message;
  },
};

function createBaseCorsConfiguration(): CorsConfiguration {
  return {
    allowedOrigins: [],
    allowedMethods: [],
    allowedHeaders: [],
    exposedHeaders: [],
    maxAge: 0,
    allowCredentials: false,
  };
}

export const CorsConfiguration = {
  fromJSON(object: any): CorsConfiguration {
    return {
      allowedOrigins: Array.isArray(object?.allowedOrigins)
        ? object.allowedOrigins.map((e: any) => ConfigurationVariable.fromJSON(e))
        : [],
      allowedMethods: Array.isArray(object?.allowedMethods)
        ? object.allowedMethods.map((e: any) => String(e))
        : [],
      allowedHeaders: Array.isArray(object?.allowedHeaders) ? object.allowedHeaders.map((e: any) => String(e)) : [],
      exposedHeaders: Array.isArray(object?.exposedHeaders) ? object.exposedHeaders.map((e: any) => String(e)) : [],
      maxAge: isSet(object.maxAge) ? Number(object.maxAge) : 0,
      allowCredentials: isSet(object.allowCredentials) ? Boolean(object.allowCredentials) : false,
    };
  },

  toJSON(message: CorsConfiguration): unknown {
    const obj: any = {};
    if (message.allowedOrigins) {
      obj.allowedOrigins = message.allowedOrigins.map((e) => e ? ConfigurationVariable.toJSON(e) : undefined);
    } else {
      obj.allowedOrigins = [];
    }
    if (message.allowedMethods) {
      obj.allowedMethods = message.allowedMethods.map((e) => e);
    } else {
      obj.allowedMethods = [];
    }
    if (message.allowedHeaders) {
      obj.allowedHeaders = message.allowedHeaders.map((e) => e);
    } else {
      obj.allowedHeaders = [];
    }
    if (message.exposedHeaders) {
      obj.exposedHeaders = message.exposedHeaders.map((e) => e);
    } else {
      obj.exposedHeaders = [];
    }
    message.maxAge !== undefined && (obj.maxAge = Math.round(message.maxAge));
    message.allowCredentials !== undefined && (obj.allowCredentials = message.allowCredentials);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CorsConfiguration>, I>>(object: I): CorsConfiguration {
    const message = createBaseCorsConfiguration();
    message.allowedOrigins = object.allowedOrigins?.map((e) => ConfigurationVariable.fromPartial(e)) || [];
    message.allowedMethods = object.allowedMethods?.map((e) => e) || [];
    message.allowedHeaders = object.allowedHeaders?.map((e) => e) || [];
    message.exposedHeaders = object.exposedHeaders?.map((e) => e) || [];
    message.maxAge = object.maxAge ?? 0;
    message.allowCredentials = object.allowCredentials ?? false;
    return message;
  },
};

function createBaseConfigurationVariable(): ConfigurationVariable {
  return {
    kind: 0,
    staticVariableContent: "",
    environmentVariableName: "",
    environmentVariableDefaultValue: "",
    placeholderVariableName: "",
  };
}

export const ConfigurationVariable = {
  fromJSON(object: any): ConfigurationVariable {
    return {
      kind: isSet(object.kind) ? configurationVariableKindFromJSON(object.kind) : 0,
      staticVariableContent: isSet(object.staticVariableContent) ? String(object.staticVariableContent) : "",
      environmentVariableName: isSet(object.environmentVariableName) ? String(object.environmentVariableName) : "",
      environmentVariableDefaultValue: isSet(object.environmentVariableDefaultValue)
        ? String(object.environmentVariableDefaultValue)
        : "",
      placeholderVariableName: isSet(object.placeholderVariableName) ? String(object.placeholderVariableName) : "",
    };
  },

  toJSON(message: ConfigurationVariable): unknown {
    const obj: any = {};
    message.kind !== undefined && (obj.kind = configurationVariableKindToJSON(message.kind));
    message.staticVariableContent !== undefined && (obj.staticVariableContent = message.staticVariableContent);
    message.environmentVariableName !== undefined && (obj.environmentVariableName = message.environmentVariableName);
    message.environmentVariableDefaultValue !== undefined &&
      (obj.environmentVariableDefaultValue = message.environmentVariableDefaultValue);
    message.placeholderVariableName !== undefined && (obj.placeholderVariableName = message.placeholderVariableName);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ConfigurationVariable>, I>>(object: I): ConfigurationVariable {
    const message = createBaseConfigurationVariable();
    message.kind = object.kind ?? 0;
    message.staticVariableContent = object.staticVariableContent ?? "";
    message.environmentVariableName = object.environmentVariableName ?? "";
    message.environmentVariableDefaultValue = object.environmentVariableDefaultValue ?? "";
    message.placeholderVariableName = object.placeholderVariableName ?? "";
    return message;
  },
};

function createBaseBuildInfo(): BuildInfo {
  return { success: false, sdk: undefined, wunderctl: undefined, node: undefined, os: undefined, stats: undefined };
}

export const BuildInfo = {
  fromJSON(object: any): BuildInfo {
    return {
      success: isSet(object.success) ? Boolean(object.success) : false,
      sdk: isSet(object.sdk) ? BuildInfoVersion.fromJSON(object.sdk) : undefined,
      wunderctl: isSet(object.wunderctl) ? BuildInfoVersion.fromJSON(object.wunderctl) : undefined,
      node: isSet(object.node) ? BuildInfoVersion.fromJSON(object.node) : undefined,
      os: isSet(object.os) ? BuildInfoOS.fromJSON(object.os) : undefined,
      stats: isSet(object.stats) ? BuildInfoStats.fromJSON(object.stats) : undefined,
    };
  },

  toJSON(message: BuildInfo): unknown {
    const obj: any = {};
    message.success !== undefined && (obj.success = message.success);
    message.sdk !== undefined && (obj.sdk = message.sdk ? BuildInfoVersion.toJSON(message.sdk) : undefined);
    message.wunderctl !== undefined &&
      (obj.wunderctl = message.wunderctl ? BuildInfoVersion.toJSON(message.wunderctl) : undefined);
    message.node !== undefined && (obj.node = message.node ? BuildInfoVersion.toJSON(message.node) : undefined);
    message.os !== undefined && (obj.os = message.os ? BuildInfoOS.toJSON(message.os) : undefined);
    message.stats !== undefined && (obj.stats = message.stats ? BuildInfoStats.toJSON(message.stats) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<BuildInfo>, I>>(object: I): BuildInfo {
    const message = createBaseBuildInfo();
    message.success = object.success ?? false;
    message.sdk = (object.sdk !== undefined && object.sdk !== null)
      ? BuildInfoVersion.fromPartial(object.sdk)
      : undefined;
    message.wunderctl = (object.wunderctl !== undefined && object.wunderctl !== null)
      ? BuildInfoVersion.fromPartial(object.wunderctl)
      : undefined;
    message.node = (object.node !== undefined && object.node !== null)
      ? BuildInfoVersion.fromPartial(object.node)
      : undefined;
    message.os = (object.os !== undefined && object.os !== null) ? BuildInfoOS.fromPartial(object.os) : undefined;
    message.stats = (object.stats !== undefined && object.stats !== null)
      ? BuildInfoStats.fromPartial(object.stats)
      : undefined;
    return message;
  },
};

function createBaseBuildInfoVersion(): BuildInfoVersion {
  return { version: "" };
}

export const BuildInfoVersion = {
  fromJSON(object: any): BuildInfoVersion {
    return { version: isSet(object.version) ? String(object.version) : "" };
  },

  toJSON(message: BuildInfoVersion): unknown {
    const obj: any = {};
    message.version !== undefined && (obj.version = message.version);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<BuildInfoVersion>, I>>(object: I): BuildInfoVersion {
    const message = createBaseBuildInfoVersion();
    message.version = object.version ?? "";
    return message;
  },
};

function createBaseBuildInfoOS(): BuildInfoOS {
  return { type: "", platform: "", arch: "", version: "", release: "" };
}

export const BuildInfoOS = {
  fromJSON(object: any): BuildInfoOS {
    return {
      type: isSet(object.type) ? String(object.type) : "",
      platform: isSet(object.platform) ? String(object.platform) : "",
      arch: isSet(object.arch) ? String(object.arch) : "",
      version: isSet(object.version) ? String(object.version) : "",
      release: isSet(object.release) ? String(object.release) : "",
    };
  },

  toJSON(message: BuildInfoOS): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = message.type);
    message.platform !== undefined && (obj.platform = message.platform);
    message.arch !== undefined && (obj.arch = message.arch);
    message.version !== undefined && (obj.version = message.version);
    message.release !== undefined && (obj.release = message.release);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<BuildInfoOS>, I>>(object: I): BuildInfoOS {
    const message = createBaseBuildInfoOS();
    message.type = object.type ?? "";
    message.platform = object.platform ?? "";
    message.arch = object.arch ?? "";
    message.version = object.version ?? "";
    message.release = object.release ?? "";
    return message;
  },
};

function createBaseBuildInfoStats(): BuildInfoStats {
  return {
    totalApis: 0,
    totalOperations: 0,
    totalWebhooks: 0,
    hasAuthenticationProvider: false,
    hasUploadProvider: false,
  };
}

export const BuildInfoStats = {
  fromJSON(object: any): BuildInfoStats {
    return {
      totalApis: isSet(object.totalApis) ? Number(object.totalApis) : 0,
      totalOperations: isSet(object.totalOperations) ? Number(object.totalOperations) : 0,
      totalWebhooks: isSet(object.totalWebhooks) ? Number(object.totalWebhooks) : 0,
      hasAuthenticationProvider: isSet(object.hasAuthenticationProvider)
        ? Boolean(object.hasAuthenticationProvider)
        : false,
      hasUploadProvider: isSet(object.hasUploadProvider) ? Boolean(object.hasUploadProvider) : false,
    };
  },

  toJSON(message: BuildInfoStats): unknown {
    const obj: any = {};
    message.totalApis !== undefined && (obj.totalApis = Math.round(message.totalApis));
    message.totalOperations !== undefined && (obj.totalOperations = Math.round(message.totalOperations));
    message.totalWebhooks !== undefined && (obj.totalWebhooks = Math.round(message.totalWebhooks));
    message.hasAuthenticationProvider !== undefined &&
      (obj.hasAuthenticationProvider = message.hasAuthenticationProvider);
    message.hasUploadProvider !== undefined && (obj.hasUploadProvider = message.hasUploadProvider);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<BuildInfoStats>, I>>(object: I): BuildInfoStats {
    const message = createBaseBuildInfoStats();
    message.totalApis = object.totalApis ?? 0;
    message.totalOperations = object.totalOperations ?? 0;
    message.totalWebhooks = object.totalWebhooks ?? 0;
    message.hasAuthenticationProvider = object.hasAuthenticationProvider ?? false;
    message.hasUploadProvider = object.hasUploadProvider ?? false;
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
