//language=handlebars
export const handlebarTemplate = `
import { ServerOptions, WunderGraphTestServer, WunderGraphMockServer, WunderGraphTestServers } from "@wundergraph/sdk/testing";
import { createClient, WunderGraphClient } from "./client";
{{#if hasServer}}
import configureWunderGraphServer from "../wundergraph.server";
{{/if}}

/**
 * Encapsulates the WunderGraphTestServers with the generated client types.
 */
export type TestServers = WunderGraphTestServers<WunderGraphClient>;

/**
 * Create a test server with the given options.
 * The test server will be started on a random port.
 * You can use the \`client()\` method to make requests against the test server.
 */
export const createTestServer = (opts?: Partial<ServerOptions<WunderGraphClient>>) => {
	return new WunderGraphTestServer({
		...opts,
		createClient: opts?.createClient ?? createClient,
		{{#if hasServer}}
		serverConfiguration: configureWunderGraphServer,
		{{/if}}
	});
}

/**
 * Create a mock server with the given options.
 * The mock server will be started on a random port.
 * You can use the \`mock()\` method to make requests against the mock server.
 */
export const createMockServer = () => {
	return new WunderGraphMockServer();
}

/**
 * Create a mock and test server with the given options.
 * All servers will be started on a random port.
 * You can use the \`testServer.client()\` method to make requests against the test server.
 */
export const createTestAndMockServer = (opts?: Partial<ServerOptions<WunderGraphClient>>) => {
	const ts = createTestServer(opts);
	const ms = createMockServer();
	return new WunderGraphTestServers<WunderGraphClient>(ms, ts);
}		
`;
