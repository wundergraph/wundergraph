import nextra from 'nextra';

const withNextra = nextra({
	theme: 'nextra-theme-docs',
	themeConfig: './theme.config.tsx',
});

export default withNextra({
	redirects: async () => [{ source: '/', destination: '/docs', permanent: true }],
});
