// node config

export const nodeAddress = 'WG_NODE_ADDR' in process.env ? process.env['WG_NODE_ADDR']! : 'localhost:9991';
export const nodeUrl = 'WG_NODE_ADDR' in process.env ? `http://${nodeAddress}` : 'http://localhost:9991';

// server config

const serverPortString: string = 'WG_SERVER_PORT' in process.env ? process.env['WG_SERVER_PORT']! : '9992';

export const serverListenPort = parseInt(serverPortString, 10);
export const serverHost = 'WG_SERVER_HOST' in process.env ? process.env['WG_SERVER_HOST']! : '127.0.0.1';
