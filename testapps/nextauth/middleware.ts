// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
	matcher: '/api/wg/:function*',
};

export function middleware(request: NextRequest) {
	const token = request.cookies.get('next-auth.session-token')?.value;

	let pathname = request.nextUrl.pathname.replace('/api/wg', '');

	const url = new URL(pathname + request.nextUrl.search, process.env.WG_GATEWAY_URL);

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
	});

	const response = NextResponse.rewrite(url, {
		request: {
			headers,
		},
	});

	return response;
}
