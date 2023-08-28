export default {
	logo: <span>WunderGraph SDK Documentation</span>,
	project: {
		link: 'https://github.com/wundergraph/wundergraph',
	},
	docsRepositoryBase: 'https://github.com/wundergraph/wundergraph/tree/main/docs-websitev3',
	useNextSeoProps() {
		return {
			titleTemplate: '%s - WunderGraph SDK Docs',
		};
	},
	sidebar: {
		defaultMenuCollapseLevel: 1,
	},
};
