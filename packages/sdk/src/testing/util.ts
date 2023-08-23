import { Request } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import { access } from 'node:fs/promises';
import getPort from 'get-port';

export async function freeport(): Promise<number> {
	return getPort({
		host: '127.0.0.1',
	});
}

export function getBody(req: Request): Promise<Buffer> {
	return getRawBody(req);
}

export async function fileExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
