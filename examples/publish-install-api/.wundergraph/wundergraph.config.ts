import {
	configurePublishWunderGraphAPI,
	configureWunderGraphApplication,
	cors,
	EnvironmentVariable,
	introspect,
	PlaceHolder,
} from '@wundergraph/sdk';
import { integrations } from './generated/wundergraph.integrations';

const weatherApi = introspect.graphql({
	// when publishing an API, your will probably NOT want to apply a namespace
	// if the user of your API will use namespacing themselves, they'll have a double namespace, e.g.: weather_weather_api
	// For that reason, only apply a namespace when you publish multiple APIs combined and a namespace is required to avoid collisions
	// If this is the case, you should consider publishing both APIs separately under a different name
	url: 'https://graphql-weather-api.herokuapp.com/',
	/*headers: builder => builder
        // add a static Header to all upstream Requests
        .addStaticHeader("AuthToken", "staticToken")
        // forward the client Request header Authorization to the upstream request using the same Header name
        .addClientRequestHeader("Authorization", "Authorization")
        // add a static Header using a PlaceHolder
        // the PlaceHolder will have to be replaced by the API user
        // this way, you can delegate the configuration to the API user
        .addStaticHeader("Authorization", new PlaceHolder("Authorization"))
        // add a static Header using a EnvironmentVariable
        // the EnvironmentVariable can be replaced by the API user
        .addStaticHeader("Authorization", new EnvironmentVariable("AUTH_TOKEN"))*/
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [weatherApi, integrations.starptech.spacex()],
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
});

// If you want to allow your API users some confiugration flexibility,
// make sure to use either a PlaceHolder or an EnvironmentVariable
//
// PlaceHolders MUST be replaced by the API user
// EnvironmentVariables can be replaced by the API user, meaning that they are optional.

// configurePublishWunderGraphAPI generates a JSON file in the generated directory which is the base to publish an API to the WunderHub
// Once generated, you can publish the API to the WunderHub by running `wunderctl publish <org>/<api>`
// E.g. if the organization is "wundergraph" and the API name is "weather" then you would run `wunderctl publish wundergraph/weather`
//
// There's also a shortcut for publishing one or more APIs after the generation of the API configuration file is done.
// Simply run `wunderctl generate --publish`
// This will generate the API configuration file and then publish the API to the WunderHub immediately
configurePublishWunderGraphAPI({
	// organization is the name of the organization you want to publish your API to
	// make sure that the logged in user has access to the organization
	organization: 'wundergraph',
	// name is the name of the API you want to publish
	name: 'weather',
	// isPublic is a boolean which determines whether the API is public or not
	// public APIs can be accessed by anyone
	// private APIs can only be accessed by users who have access to the organization
	isPublic: true,
	// shortDescription is a catchy short description that is visible when users browse API search results on the WunderHub
	// Make sure this text is short, inviting and describes the API well
	shortDescription: 'A public GraphQL Weather API',
	// keywords help users of the WunderHub to better find your API
	keywords: ['weather'],

	// markdownDescriptionFile can be used to provide a description of your API in markdown format
	// This will be displayed on the API details page on the WunderHub
	// If you don't want to provide a description, just leave this empty
	//markdownDescriptionFile: "./README.md",

	// If you're storing the code to generate and publish an API in a git repository,
	// you can provide a git repository URL to the API configuration file
	// This will be displayed on the API details page on the WunderHub
	// This is useful if you want to enable collaboration
	// repositoryUrl: "",

	// apis is a list of APIs you want to combine an publish as a single API
	// If APIs might have naming collisions, consider publishing multiple APIs separately instead of using namespaces
	// Make sure that you don't accidentally publish a namespaced API
	apis: [weatherApi],
});
