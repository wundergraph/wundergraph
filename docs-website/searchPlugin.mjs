import Markdoc from '@markdoc/markdoc';
import { readFile } from 'fs/promises';
import { globby } from 'globby';
import yaml from 'js-yaml';
import { default as webpack } from 'webpack';

const sources = webpack.sources;
const pluginName = 'SearchPlugin';
const isDev = process.env.NODE_ENV !== 'production';

function generateID(children, attributes) {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}
	return children
		.filter((child) => typeof child === 'string')
		.join(' ')
		.replace(/[?]/g, '')
		.replace(/\s+/g, '-')
		.toLowerCase();
}

function getTitle(children) {
	return children.filter((child) => typeof child === 'string').join(' ');
}

async function parseDocs() {
	const allDocs = [];
	const allFilesOps = [];

	const paths = await globby(['src/pages/docs/**/*.md']);
	for (const path of paths) {
		allFilesOps.push(await readFile(path, 'utf8'));
	}

	const allFiles = await Promise.all(allFilesOps);

	for (let i = 0; i < allFiles.length; i++) {
		const filePath = paths[i];
		const ast = Markdoc.parse(allFiles[i]);

		const frontmatter = ast.attributes.frontmatter ? yaml.load(ast.attributes.frontmatter) : {};

		const transformedContent = Markdoc.transform(ast, {
			variables: {
				variables: {
					markdoc: {
						frontmatter,
					},
				},
			},
		});

		const structuredContent = {};
		let prevHeadingNode;
		let textContent = '';

		function extract(children) {
			children.forEach((node) => {
				if (typeof node === 'string') {
					textContent += node;
				} else if (node.name === 'h2') {
					textContent = textContent
						.trim()
						.split('\n')
						.map((line) => line.trim())
						.join('\n');

					let key = '';
					if (prevHeadingNode) {
						const { children, attributes } = prevHeadingNode;
						key = generateID(children, attributes) + '#' + getTitle(children);
					}
					structuredContent[key] = textContent;
					prevHeadingNode = node;
					textContent = '';
				} else if (node.children != undefined) {
					extract(node.children);
				}
			});
		}

		extract(transformedContent.children);

		let route = filePath.replace(/^src\/pages\/docs\//, '/docs/').replace(/\.md$/, '');
		if (route.endsWith('/index')) {
			const indexPosition = route.lastIndexOf('/index');
			if (indexPosition !== -1) {
				route = route.substring(0, indexPosition);
				console.log(route);
			}
		}

		const doc = {
			title: `${frontmatter.title}`,
			route,
			data: structuredContent,
		};

		allDocs.push(doc);
	}

	return allDocs;
}

export class SearchPlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			compilation.hooks.processAssets.tapAsync(
				{
					name: pluginName,
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
				},
				async (_, callback) => {
					const indexFiles = {};

					const allDocs = await parseDocs();

					allDocs.forEach((doc, index) => {
						const { title, data, route } = doc;
						const indexFilename = `search-data.json`;
						if (indexFiles[indexFilename] === undefined) {
							indexFiles[indexFilename] = '{';
						}
						if (indexFiles[indexFilename] !== '{') {
							indexFiles[indexFilename] += ',';
						}
						indexFiles[indexFilename] += `${JSON.stringify(route)}:{"title":${JSON.stringify(
							title
						)},"data":${JSON.stringify(data)}}`;
					});

					for (const [file, content] of Object.entries(indexFiles)) {
						const filename = (isDev ? '../static/chunks/' : '../../static/chunks/') + file;
						const source = new sources.RawSource(content + '}');
						const existingAsset = compilation.getAsset(filename);

						if (existingAsset) {
							compilation.updateAsset(filename, source);
						} else {
							compilation.emitAsset(filename, source);
						}
					}

					callback();
				}
			);
		});
	}
}
