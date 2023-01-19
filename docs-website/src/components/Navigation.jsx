import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import clsx from 'clsx'
import { scrollIntoViewIfNeeded } from '../utils/scroll-into-view'

function SubNavigation({ navigation, className }) {
	return (
		<ul role="list" className="space-y-9">
			{navigation.map((section) => (
				<li key={section.title}>
					<h2 className="font-display font-medium text-slate-900 dark:text-white">
						{section.title}
					</h2>
					<ul
						role="list"
						className="mt-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 lg:mt-4 lg:space-y-4 lg:border-slate-200"
					>
						{section.links?.map((link) => (
							<li key={link.href} className="relative">
								{link.href ? <NavLink {...link} /> : link.title}
							</li>
						))}
					</ul>
				</li>
			))}
		</ul>
	)
}

export function Navigation({ navigation, className }) {
	return (
		<nav className={clsx('text-base lg:text-sm', className)}>
			<ul role="list" className="space-y-4">
				{navigation.map((section) =>
					section.type === 'divider' ? (
						<li className="mb-2 border-b border-transparent" />
					) : (
						<li key={section.title}>
							<NavLink {...section} />
						</li>
					)
				)}
			</ul>
		</nav>
	)
}

const NavLink = ({ href, title, icon, className }) => {
	let router = useRouter()

	const ref = React.useRef(null)
	const routeRef = React.useRef(null)

	React.useEffect(() => {
		if (
			href === router.pathname &&
			ref.current &&
			routeRef.current !== router.pathname
		) {
			scrollIntoViewIfNeeded(
				ref.current.parentNode.parentNode,
				routeRef.current
					? {
							offsetTop: 72, // the header
					  }
					: {
							block: 'center',
					  }
			)
		}
		routeRef.current = router.pathname
	}, [router.pathname])

	return (
		<Link
			ref={ref}
			href={href || ''}
			className={clsx(
				'flex w-full items-center pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
				href === router.pathname
					? 'font-semibold text-sky-600 before:bg-sky-500'
					: 'text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block dark:text-slate-400 dark:before:bg-slate-700 dark:hover:text-slate-300',
				className
			)}
		>
			{icon && <span className="mr-2 inline-block h-4 w-4">{icon}</span>}
			{title}
		</Link>
	)
}
