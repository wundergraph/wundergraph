import Head from 'next/head';
import { slugifyWithCounter } from '@sindresorhus/slugify';
import { Layout } from '@/components/Layout';
import 'focus-visible';
import '@/styles/globals.css';
import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { plausible } from '@/utils/analytics';
import Seo from '@/components/Seo';

function getNodeText(node) {
	let text = '';
	for (let child of node.children ?? []) {
		if (typeof child === 'string') {
			text += child;
		}
		text += getNodeText(child);
	}
	return text;
}

function collectHeadings(nodes, slugify = slugifyWithCounter()) {
	let sections = [];

	for (let node of nodes) {
		if (node.name === 'Heading') {
			let title = getNodeText(node);
			if (title) {
				let id = slugify(title);
				node.attributes.id = id;
				if (node.attributes.level === 3) {
					if (!sections[sections.length - 1]) {
						throw new Error('Cannot add `h3` to table of contents without a preceding `h2`');
					}
					sections[sections.length - 1].children.push({
						...node.attributes,
						title,
					});
				} else {
					sections.push({ ...node.attributes, title, children: [] });
				}
			}
		}

		sections.push(...collectHeadings(node.children ?? [], slugify));
	}

	return sections;
}

export default function App({ Component, pageProps }) {
	useEffect(() => {
		plausible.enableAutoPageviews();
	}, []);

	let title = pageProps.title || pageProps.markdoc?.frontmatter.title || 'WunderGraph';
	let description = pageProps.description || pageProps.markdoc?.frontmatter.description;

	let tableOfContents = pageProps.markdoc?.content ? collectHeadings(pageProps.markdoc.content) : [];

	return (
		<>
			<Seo title={title} description={description} />
			<ThemeProvider attribute="class" enableSystem>
				<Layout title={title} tableOfContents={tableOfContents} frontmatter={pageProps.markdoc?.frontmatter}>
					<Component {...pageProps} />
				</Layout>
			</ThemeProvider>
		</>
	);
}
