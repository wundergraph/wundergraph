import {
	authProviders,
	configureWunderGraphApplication,
	cors,
	EnvironmentVariable,
	introspect,
	templates,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/graphql',
});

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
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

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

const counter = introspect.graphql({
	id: 'counter',
	apiNamespace: 'ws',
	subscriptionsUseSSE: true,
	url: 'http://localhost:3003/api/graphql',
	loadSchemaFromString: `
			type Query {
				hello: String
			}

			type Subscription {
				countdown(from: Int!): Countdown!
			}

			type Countdown {
				countdown: Int!
				description: String!
			}
			
			schema {
				query: Query
				subscription: Subscription
			}`,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [
		countries,
		weather,
		spaceX,
		counter,
		//jspFieldsRenamed,
		/*federatedApi,
            openAPI,
            graphQLAPI*/
	],
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
			uploadProfiles: {
				avatar: {
					maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
					maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
					allowedMimeTypes: ['image/png', 'image/jpeg'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
					allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
				},
				coverPicture: {
					meta: {
						type: 'object',
						properties: {
							postId: {
								type: 'string',
							},
						},
					},
					maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
					maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
					allowedMimeTypes: ['image/*'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
					allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
				},
			},
		},
		{
			name: 'minio2',
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
			templates: [...templates.typescript.all],
		},
		{
			templates: [new NextJsTemplate()],
			path: '../components/generated',
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:3003'],
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
			authorizedRedirectUriRegexes: ['http://localhost:3003*'],
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
