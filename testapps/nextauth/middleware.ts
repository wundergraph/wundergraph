// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
	matcher: '/api/wg/:function*',
};

export function middleware(request: NextRequest) {
	const token = request.cookies.get('next-auth.session-token')?.value;

	const url = new URL(
		request.nextUrl.pathname.replace('/api/wg', '') + request.nextUrl.search,
		'http://localhost:9991'
	);

	const response = NextResponse.rewrite(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return response;
}
