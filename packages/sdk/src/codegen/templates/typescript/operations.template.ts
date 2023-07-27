//language=handlebars
export const template = `
import type {
    BaseOperationConfiguration,
    ConfigureQuery,
    ConfigureSubscription,
    ConfigureMutation,
    CustomizeQuery,
    CustomizeMutation,
    CustomizeSubscription,
    QueryConfiguration,
    SubscriptionConfiguration,
    MutationConfiguration,
    WunderGraphOperationsConfig
} from "@wundergraph/sdk"

export interface OperationsConfiguration {
    // defaultConfig is the base for all configurations
    // all configuration shared across queries, mutations and subscriptions can be done in the default config
    defaultConfig: BaseOperationConfiguration;

    // queries lets you define the base config for all Queries
    // the input config is the defaultConfig object
    queries: ConfigureQuery;

    mutations: ConfigureMutation;
    subscriptions: ConfigureSubscription;

    // custom allows you to override settings for each individual operation
    // the input config is the default config + the query/mutation/subscription extra config
    custom?: {
        {{#each operations}}
        "{{name}}"?: {{#if isQuery}}CustomizeQuery{{/if}}{{#if isMutation}}CustomizeMutation{{/if}}{{#if isSubscription}}CustomizeSubscription{{/if}};
        {{/each}}
    }
}

declare module "@wundergraph/sdk" {
    interface CustomOperationsConfiguration {
        {{#each operations}}
        "{{name}}"?: Partial<{{#if isQuery}}QueryConfiguration{{/if}}{{#if isMutation}}MutationConfiguration{{/if}}{{#if isSubscription}}SubscriptionConfiguration{{/if}}>;
        {{/each}}
    }

	export function configureWunderGraphOperations<
		GeneratedOperationConfiguration extends OperationsConfiguration
	>(
		config: WunderGraphOperationsConfig<GeneratedOperationConfiguration>
	): WunderGraphOperationsConfig<GeneratedOperationConfiguration>['operations']
}
`;
