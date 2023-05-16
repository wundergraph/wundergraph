import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { scrollIntoViewIfNeeded } from '../utils/scroll-into-view';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';

function SubNavigation({ navigation, className }) {
	return (
		<>
			<div className="relative">
				<Link
					className="font-xs group -ml-5 flex items-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
					href="/"
				>
					<span className="mr-1 inline-block h-4 w-4 transition-all group-hover:-translate-x-1">
						<ArrowLeftIcon />
					</span>
					All docs
				</Link>
			</div>

			<h2 className="relative mt-8 mb-2 flex flex-row items-center font-display text-lg font-medium text-gray-900 dark:text-white">
				<span className="absolute -left-6 mr-2 inline-block h-5 w-5">{navigation?.icon}</span> {navigation?.title}
			</h2>
			<ul role="list">
				{navigation?.links?.map((section) => (
					<li key={section.title} className="relative">
						{section.href ? (
							<PrimaryNavLink {...section} />
						) : (
							<>
								<h3 className="mt-8 font-display font-medium text-gray-900 dark:text-white">{section.title}</h3>
								<ul
									role="list"
									className="mt-2 border-l-2 border-gray-100 dark:border-gray-800 lg:mt-4 lg:border-gray-200"
								>
									{section.links?.map((link) => (
										<li key={link.href} className="relative">
											{link.href ? <NavLink {...link} /> : link.title}
										</li>
									))}
								</ul>
							</>
						)}
					</li>
				))}
			</ul>
		</>
	);
}

export function Navigation({ navigation, className }) {
	const router = useRouter();
	const path = router.asPath;
	const isRoot = path === '/';

	const subNavigation = React.useMemo(
		() =>
			!isRoot &&
			navigation.find(({ href, paths, links }) => {
				if (!links) return false;

				return [href].concat(paths || []).some((href) => path.match(href));
			}),
		[navigation, path, isRoot]
	);

	return (
		<nav className={clsx('flex text-base lg:text-sm', className)}>
			<ul
				role="list"
				className={clsx(
					'pb-16 transition-transform lg:absolute ',
					!isRoot && subNavigation ? 'hidden -translate-x-full opacity-0 lg:block' : 'translate-x-0'
				)}
			>
				{navigation.map((section, i) => {
					switch (section.type) {
						case 'divider':
							return <li key={i} className="mb-4 border-b border-transparent" />;
						case 'title':
							return (
								<li key={section.title} className="relative mb-2">
									<h3 className="mt-8 font-display font-medium text-gray-400 dark:text-gray-500">{section.title}</h3>
								</li>
							);
						case 'link':
						default:
							return (
								<li key={section.title} className="relative">
									<PrimaryNavLink {...section} />
								</li>
							);
					}
				})}
			</ul>
			<div
				className={clsx(
					'pb-16 pl-4 transition-transform lg:absolute ',
					isRoot || !subNavigation ? 'hidden translate-x-full opacity-0 lg:block' : 'translate-x-0'
				)}
			>
				{subNavigation && <SubNavigation navigation={subNavigation} />}
			</div>
		</nav>
	);
}

const PrimaryNavLink = ({ href, title, icon, className }) => {
	let router = useRouter();
	const ref = React.useRef(null);
	const isActive = href === router.pathname;
	return (
		<Link
			ref={ref}
			href={href || ''}
			onClick={() => {
				ref.current.parentNode?.parentNode?.parentNode?.parentNode?.scrollTo({ top: 0 });
			}}
			className={clsx(
				'active group flex w-full items-center py-2',
				isActive
					? 'font-semibold text-pink-500 before:bg-pink-500'
					: 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:before:bg-gray-700 dark:hover:text-gray-100',
				className
			)}
		>
			{icon && (
				<span
					className={clsx('mr-2 inline-block h-4 w-4 opacity-40 group-hover:opacity-90', {
						'opacity-100': isActive,
					})}
				>
					{icon}
				</span>
			)}
			{title}
		</Link>
	);
};

const NavLink = ({ href, title, icon, className }) => {
	let router = useRouter();

	const ref = React.useRef(null);
	const routeRef = React.useRef(null);

	React.useEffect(() => {
		if (href === router.pathname && ref.current && routeRef.current !== router.pathname) {
			scrollIntoViewIfNeeded(
				ref.current.parentNode.parentNode,
				routeRef.current
					? {
							offsetTop: 72, // the header
					  }
					: {
							block: 'center',
					  }
			);
		}
		routeRef.current = router.pathname;
	}, [router.pathname, href]);

	return (
		<Link
			ref={ref}
			href={href || ''}
			className={clsx(
				'5 flex w-full items-center py-2 pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
				href === router.pathname
					? 'font-semibold text-pink-500 before:bg-pink-500'
					: 'text-gray-500 before:hidden before:bg-gray-300 hover:text-gray-800 hover:before:block dark:text-gray-400 dark:before:bg-gray-700 dark:hover:text-gray-300',
				className
			)}
		>
			{icon && <span className="mr-2 inline-block h-4 w-4">{icon}</span>}
			{title}
		</Link>
	);
};
