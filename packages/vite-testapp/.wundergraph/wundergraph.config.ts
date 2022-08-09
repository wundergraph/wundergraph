import {
	Application,
	authProviders,
	configureWunderGraphApplication,
	cors,
	EnvironmentVariable,
	introspect,
	templates,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
// import linkBuilder from "./generated/linkbuilder";
import { ReactTemplate } from '@wundergraph/react/dist/template';

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://api.spacex.land/graphql/',
});

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://graphql-weather-api.herokuapp.com/',
});

/*const jsonPlaceholder = introspect.openApi({
    source: {
        kind: "file",
        filePath: "jsonplaceholder.v1.yaml"
    },
});

const jspTypesRenamed = transformApi.renameTypes(jsonPlaceholder,{
    from: "User",
    to: "JSP_User"
})

const jspFieldsRenamed = transformApi.renameFields(jspTypesRenamed,{
    typeName: "Query",
    fromFieldName: "users",
    toFieldName: "jsp_users",
})*/

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
});*/

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
});*/

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

const myApplication = new Application({
	name: 'api',
	apis: [
		weather,
		spaceX,
		//jspFieldsRenamed,
		/*federatedApi,
            openAPI,
            graphQLAPI*/
	],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	application: myApplication,
	server,
	operations,
	// S3 Server
	// 1. Move to`../minio` and run (chmod +x && ./setup.sh) to create a S3 server.
	// 2. Comment out the section below and save!

	// Enable file upload functionality in your generated client
	// Minio credentials: minio / minio123
	s3UploadProvider: [
		{
			name: 'minio',
			endpoint: '127.0.0.1:9000',
			accessKeyID: 'test',
			secretAccessKey: '12345678',
			bucketLocation: 'eu-central-1',
			bucketName: 'uploads',
			useSSL: false,
		},
	],
	codeGenerators: [
		{
			templates: [...templates.typescript.all, templates.typescript.operations, templates.typescript.linkBuilder],
		},
		{
			templates: [new ReactTemplate()],
			path: '../src/components/generated',
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:5173'],
	},
	authentication: {
		cookieBased: {
			providers: [
				authProviders.demo(),
				authProviders.openIdConnect({
					id: 'auth0',
					issuer: new EnvironmentVariable('AUTH0_ISSUER'),
					clientId: new EnvironmentVariable('AUTH0_CLIENT_ID'),
					clientSecret: new EnvironmentVariable('AUTH0_CLIENT_SECRET'),
				}),
			],
			authorizedRedirectUris: ['http://localhost:5173/authentication', 'http://localhost:5173/auth-test'],
		},
	},
	/*links: [
          linkBuilder
              .source("userPosts")
              .target("JSP_User","posts")
              .argument("userID", "objectField", "id")
              .build(),
          linkBuilder
              .source("postComments")
              .target("Post","comments")
              .argument("postID", "objectField", "id")
              .build(),
      ],*/
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
