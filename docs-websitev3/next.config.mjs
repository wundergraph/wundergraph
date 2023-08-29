import nextra from 'nextra';

const withNextra = nextra({
	theme: 'nextra-theme-docs',
	themeConfig: './theme.config.tsx',
});

export default withNextra({
	redirects: async () => [
		{ source: '/', destination: '/docs', permanent: true },
		{
			source: '/docs/apis/graphql',
			destination: '/docs/datasources/graphql',
			permanent: true,
		},
		{
			source: '/docs/apis/apollo-federation',
			destination: '/docs/datasources/graphql-federation',
			permanent: true,
		},
		{
			source: '/docs/apis/rest-openapi',
			destination: '/docs/datasources/rest-openapi',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/openid-connect',
			destination: '/docs/auth/openid-connect',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/auth0',
			destination: '/docs/auth/auth0',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/keycloak',
			destination: '/docs/auth/keycloak',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/github',
			destination: '/docs/auth/github',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/google',
			destination: '/docs/auth/google',
			permanent: true,
		},
		{
			source: '/docs/auth/token-based-auth/openid-connect',
			destination: '/docs/auth/jwks',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/auth-js',
			destination: '/docs/auth/auth-js',
			permanent: true,
		},
		{
			source: '/docs/auth/cookie-based-auth/clerk',
			destination: '/docs/auth/clerk',
			permanent: true,
		},
	],
});
