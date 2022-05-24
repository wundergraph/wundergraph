export const listenAddr = 'WG_LISTEN_ADDR' in process.env ? process.env['WG_LISTEN_ADDR']! : 'localhost:9991';
export const listenAddrHttp = 'WG_LISTEN_ADDR' in process.env ? `http://${listenAddr}` : 'http://localhost:9991';
export const middlewarePortString: string =
	'WG_MIDDLEWARE_PORT' in process.env ? process.env['WG_MIDDLEWARE_PORT']! : '9992';
export const middlewarePort = parseInt(middlewarePortString, 10);
