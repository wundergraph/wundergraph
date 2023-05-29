import net from 'net';
import { Request } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import { access } from 'node:fs/promises';
import getPort from 'get-port';

export async function freeport(): Promise<number> {
	return getPort({
		host: '127.0.0.1',
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
