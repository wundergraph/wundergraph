import bigJson from 'big-json';

/**
 * Encodes the given data as JSON, handling large payloads
 *
 * @param data Data to encode as JSON
 * @returns String with JSON-encoded data
 */
export const toJson = async (data: any): Promise<string> => {
	// bigJSON only supports arrays and objects as top level elements
	if (typeof data !== 'object') {
		return JSON.stringify(data);
	}
	const stream = bigJson.createStringifyStream({ body: data });
	const chunks: Buffer[] = [];
	return new Promise((resolve, reject) => {
		stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
		stream.on('error', (err) => reject(err));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
	});
};
