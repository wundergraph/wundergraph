import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

/*
uncomment this section to create an API from multiple federated GraphQL upstreams

const federatedApi = introspect.federation({
    upstreams: [
        {
            url: "http://localhost:4001/graphql"
        },
        {
            url: "http://localhost:4002/graphql"
        },
        {
            url: "http://localhost:4003/graphql"
        },
        {
            url: "http://localhost:4004/graphql",
            // You can use headers to securely communicate with GraphQL upstreams
            headers: builder => builder
                // add a static Header to all upstream Requests
                .addStaticHeader("AuthToken","staticToken")
                // forward the client Request header Authorization to the upstream request using the same Header name
                .addClientRequestHeader("Authorization","Authorization")
        },
    ]
});
*/

/*
uncomment this section to create an API from an OpenAPI Specification

const openAPI = introspect.openApi({
    source: {
        kind: "file",
        filePath: "my_api_oas.json"
    },
    headers: builder => builder
        // add a static Header to all upstream Requests
        .addStaticHeader("AuthToken","staticToken")
        // forward the client Request header Authorization to the upstream request using the same Header name
        .addClientRequestHeader("Authorization","Authorization")
});
*/

/*
uncomment this section to create an API from a GraphQL upstream

const graphQLAPI = introspect.graphql({
    url: "http://localhost:4000",
    headers: builder => builder
        // add a static Header to all upstream Requests
        .addStaticHeader("AuthToken","staticToken")
        // forward the client Request header Authorization to the upstream request using the same Header name
        .addClientRequestHeader("Authorization","Authorization")
});*/

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [
		spaceX,
		/*federatedApi,
        openAPI,
        graphQLAPI*/
	],
	server,
	operations,
	generate: {
		codeGenerators: [],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				? [
						// change this before deploying to production to the actual domain where you're deploying your app
						'http://localhost:3000',
				  ]
				: ['http://localhost:3000', new EnvironmentVariable('WG_ALLOWED_ORIGIN')],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
