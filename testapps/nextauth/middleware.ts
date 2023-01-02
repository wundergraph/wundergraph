// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
	matcher: '/api/wg/:function*',
};

export function middleware(request: NextRequest) {
	const token = request.cookies.get('next-auth.session-token')?.value;

	let pathname = request.nextUrl.pathname.replace('/api/wg', '');
	// we don't need csrf protection for token based auth, so we just return an empty string here.
	if (pathname.match('/auth/cookie/csrf')) {
		return new NextResponse(' ', { status: 200 });
	}

	// we use token based auth, so we need to rewrite the cookie based auth endpoint.
	if (pathname.match('/auth/cookie/user')) {
		pathname = pathname.replace('cookie', 'token');
	}

	const url = new URL(pathname + request.nextUrl.search, 'http://127.0.0.1:9991');

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
