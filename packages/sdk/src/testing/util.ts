import net from 'net';
import { Request } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import { access } from 'node:fs/promises';

export async function freeport(): Promise<number> {
	const server = net.createServer();
	await new Promise<void>((resolve, reject) => server.listen(0, resolve).on('error', reject));
	const address = server.address() as net.AddressInfo;
	const port = address.port;
	await new Promise((resolve) => server.close(resolve));
	return port;
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
