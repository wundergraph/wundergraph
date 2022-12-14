//language=handlebars
export const handlebarTemplate = `
import { ServerOptions, WunderGraphTestServer } from "@wundergraph/sdk/testing";
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
`;
