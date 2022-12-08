//language=handlebars
export const handlebarTemplate = `
import { ServerOptions, WunderGraphTestServer as WunderGraphTestServerInternal } from '@wundergraph/sdk/testing';
import { createClient, WunderGraphClient } from './client';

export class WunderGraphTestServer extends WunderGraphTestServerInternal<WunderGraphClient> {
    constructor(opts?: Partial<ServerOptions<WunderGraphClient>>) {
        if (!opts?.createClient) {
            if (!opts) {
                opts = {};
            }
            opts.createClient = createClient;
        }
        super(opts);
    }
}
`;
