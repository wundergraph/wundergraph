import { Combobox } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { BookOpenIcon, FaceFrownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import FlexSearch from 'flexsearch';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { HighlightMatches } from './highlight-matches';

const DEFAULT_LOCALE = 'en-US';

type SearchResult = {
	id: string;
	prefix?: ReactNode;
	route: string;
	children: ReactNode;
};

type SectionIndex = FlexSearch.Document<
	{
		id: string;
		url: string;
		title: string;
		pageId: string;
		content: string;
		display?: string;
	},
	['title', 'content', 'url', 'display']
>;

type PageIndex = FlexSearch.Document<
	{
		id: number;
		title: string;
		content: string;
	},
	['title']
>;

type Result = {
	_page_rk: number;
	_section_rk: number;
	route: string;
	prefix?: ReactNode;
	children: ReactNode;
};

type NextraData = {
	[route: string]: {
		title: string;
		data: Record<string, string>;
	};
};

// This can be global for better caching.
const indexes: {
	[locale: string]: [PageIndex, SectionIndex];
} = {};

// Caches promises that load the index
const loadIndexesPromises = new Map<string, Promise<void>>();
const loadIndexes = (basePath: string, locale: string): Promise<void> => {
	const key = basePath + '@' + locale;
	if (loadIndexesPromises.has(key)) {
		return loadIndexesPromises.get(key)!;
	}
	const promise = loadIndexesImpl(basePath, locale);
	loadIndexesPromises.set(key, promise);
	return promise;
};

const loadIndexesImpl = async (basePath: string, locale: string): Promise<void> => {
	const response = await fetch(`${basePath}/_next/static/chunks/search-data.json`);
	const data = (await response.json()) as NextraData;

	const pageIndex: PageIndex = new FlexSearch.Document({
		cache: 100,
		tokenize: 'full',
		document: {
			id: 'id',
			index: 'content',
			store: ['title'],
		},
		context: {
			resolution: 9,
			depth: 2,
			bidirectional: true,
		},
	});

	const sectionIndex: SectionIndex = new FlexSearch.Document({
		cache: 100,
		tokenize: 'full',
		document: {
			id: 'id',
			index: 'content',
			tag: 'pageId',
			store: ['title', 'content', 'url', 'display'],
		},
		context: {
			resolution: 9,
			depth: 2,
			bidirectional: true,
		},
	});

	let pageId = 0;
	for (const route in data) {
		let pageContent = '';
		++pageId;

		for (const heading in data[route].data) {
			const [hash, text] = heading.split('#');
			const url = route + (hash ? '#' + hash : '');
			const title = text || data[route].title;

			const content = data[route].data[heading] || '';
			const paragraphs = content.split('\n').filter(Boolean);

			sectionIndex.add({
				id: url,
				url,
				title,
				pageId: `page_${pageId}`,
				content: title,
				...(paragraphs[0] && { display: paragraphs[0] }),
			});

			for (let i = 0; i < paragraphs.length; i++) {
				sectionIndex.add({
					id: `${url}_${i}`,
					url,
					title,
					pageId: `page_${pageId}`,
					content: paragraphs[i],
				});
			}

			// Add the page itself.
			pageContent += ` ${title} ${content}`;
		}

		pageIndex.add({
			id: pageId,
			title: data[route].title,
			content: pageContent,
		});
	}

	indexes[locale] = [pageIndex, sectionIndex];
};

export const Flexsearch = ({ close }: { close: () => void }) => {
	const { locale = DEFAULT_LOCALE, basePath, push } = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [search, setSearch] = useState('');

	const doSearch = (search: string) => {
		if (!search) return;
		const [pageIndex, sectionIndex] = indexes[locale];

		// Show the results for the top 5 pages
		const pageResults =
			pageIndex.search<true>(search, 5, {
				enrich: true,
				suggest: true,
			})[0]?.result || [];

		const results: Result[] = [];
		const pageTitleMatches: Record<number, number> = {};

		for (let i = 0; i < pageResults.length; i++) {
			const result = pageResults[i];
			pageTitleMatches[i] = 0;

			// Show the top 5 results for each page
			const sectionResults =
				sectionIndex.search<true>(search, 5, {
					enrich: true,
					suggest: true,
					tag: `page_${result.id}`,
				})[0]?.result || [];

			let isFirstItemOfPage = true;
			const occurred: Record<string, boolean> = {};

			for (let j = 0; j < sectionResults.length; j++) {
				const { doc } = sectionResults[j];
				const isMatchingTitle = doc.display !== undefined;
				if (isMatchingTitle) {
					pageTitleMatches[i]++;
				}
				const { url, title } = doc;
				const content = doc.display || doc.content;
				if (occurred[url + '@' + content]) continue;
				occurred[url + '@' + content] = true;
				results.push({
					_page_rk: i,
					_section_rk: j,
					route: url,
					prefix: isFirstItemOfPage ? result.doc.title : undefined,
					children: (
						<>
							<div className="pb-2 text-sm font-semibold dark:text-white">
								<HighlightMatches match={search} value={title} />
							</div>
							<div className="text-xs dark:text-gray-300">
								<HighlightMatches match={search} value={content} />
							</div>
						</>
					),
				});
				isFirstItemOfPage = false;
			}
		}

		setResults(
			results
				.sort((a, b) => {
					// Sort by number of matches in the title.
					if (a._page_rk === b._page_rk) {
						return a._section_rk - b._section_rk;
					}
					if (pageTitleMatches[a._page_rk] !== pageTitleMatches[b._page_rk]) {
						return pageTitleMatches[b._page_rk] - pageTitleMatches[a._page_rk];
					}
					return a._page_rk - b._page_rk;
				})
				.map((res) => ({
					id: `${res._page_rk}_${res._section_rk}`,
					route: res.route,
					prefix: res.prefix,
					children: res.children,
				}))
		);
	};

	const preload = useCallback(
		async (active: boolean) => {
			if (active && !indexes[locale]) {
				setLoading(true);
				try {
					await loadIndexes(basePath, locale);
				} catch (e) {
					console.log(e);
					setError(true);
				}
				setLoading(false);
			}
		},
		[locale, basePath]
	);

	const handleChange = async (value: string) => {
		setSearch(value);
		if (loading) {
			return;
		}
		if (!indexes[locale]) {
			setLoading(true);
			try {
				await loadIndexes(basePath, locale);
			} catch (e) {
				setError(true);
			}
			setLoading(false);
		}
		doSearch(value);
	};

	return (
		<Combobox
			onChange={(value: any) => {
				close();
				push(value);
			}}
		>
			<div className="relative">
				<MagnifyingGlassIcon
					className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
					aria-hidden="true"
				/>
				<Combobox.Input
					className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 sm:text-sm"
					placeholder="Search"
					value={search}
					onFocus={() => preload(true)}
					onChange={(event) => handleChange(event.target.value)}
				/>
			</div>

			{search === '' && (
				<div className="border-t border-gray-100 px-6 py-14 text-center text-sm dark:border-gray-700 sm:px-14">
					<BookOpenIcon className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
					<p className="mt-4 font-semibold text-gray-900 dark:text-gray-100">Search the documentation</p>
					<p className="mt-2 text-gray-500">Quickly access anything within the docs by running a global search.</p>
				</div>
			)}

			{search !== '' && results.length > 0 && (
				<Combobox.Options className="scrollbar-custom max-h-96 scroll-pb-2 scroll-pt-11 overflow-y-auto pb-2 overflow-x-hidden">
					{results.map(({ route, prefix, children, id }, i) => (
						<li key={id}>
							{prefix && (
								<h2 className="bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-800 dark:bg-gray-700/30 dark:text-gray-200">
									{prefix}
								</h2>
							)}

							<Combobox.Option
								value={route}
								className={({ active }) =>
									clsx(
										'm-2 mr-0 flex cursor-pointer flex-col rounded-md px-4 py-2 hover:bg-gray-700/50',
										active && 'bg-gray-700/50 text-white'
									)
								}
							>
								{children}
							</Combobox.Option>
						</li>
					))}
				</Combobox.Options>
			)}

			{search !== '' && results.length === 0 && (
				<div className="border-t border-gray-100 px-6 py-14 text-center text-sm dark:border-gray-700 sm:px-14">
					<FaceFrownIcon className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
					<p className="mt-4 font-semibold text-gray-800 dark:text-gray-100">No results found</p>
					<p className="mt-2 text-gray-500">We couldn’t find anything with that term. Please try again.</p>
				</div>
			)}
		</Combobox>
	);
};
