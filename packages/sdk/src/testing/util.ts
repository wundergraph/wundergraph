import net from 'net';

export async function freeport(): Promise<number> {
	const server = net.createServer();
	await new Promise<void>((resolve, reject) => server.listen(0, resolve).on('error', reject));
	const address = server.address() as net.AddressInfo;
	const port = address.port;
	await new Promise((resolve) => server.close(resolve));
	return port;
}
