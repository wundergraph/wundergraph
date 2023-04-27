//language=handlebars
export const handlebarTemplate = `
import { ServerOptions, WunderGraphTestServer, WunderGraphMockServer, TestServers } from "@wundergraph/sdk/testing";
import { createClient, WunderGraphClient } from "./client";

export const createTestServer = (opts?: Partial<ServerOptions<WunderGraphClient>>) => {
	if (!opts?.createClient) {
		if (!opts) {
			opts = {};
		}
		opts.createClient = createClient;
	}
	return new WunderGraphTestServer(opts);
}

export const createMockServer = () => {
	return new WunderGraphMockServer();
}
export const createTestAndMockServer = (opts?: Partial<ServerOptions<WunderGraphClient>>): TestServers => {
	const ts = createTestServer(opts);
	const ms = createMockServer();
	return new TestServers(ms, ts);
}		
`;
