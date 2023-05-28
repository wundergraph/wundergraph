import net from 'net';
import { Request } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import { access } from 'node:fs/promises';

export async function freeport(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = net.createServer();
		server.once('error', reject);
		server.listen(0, () => {
			const address = server.address() as net.AddressInfo;
			const port = address.port;
			server.close(() => resolve(port));
		});
	});
}

export function getJSONBody<Body = any>(req: Request): Promise<Body> {
	return new Promise((resolve, reject) => {
		getRawBody(req, (err, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(body.toString()));
			}
		});
	});
}

export function getBody(req: Request): Promise<Buffer> {
	return getRawBody(req);
}

export function getTextBody(req: Request): Promise<string> {
	return new Promise((resolve, reject) => {
		getRawBody(req, (err, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(body.toString());
			}
		});
	});
}

export async function fileExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
