import Link from 'next/link'
import clsx from 'clsx'
import { Icon } from '@/components/Icon'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

export function QuickLinks({ children, className }) {
	return (
		<div
			className={clsx(
				'not-prose my-6 grid grid-cols-1 gap-6 sm:grid-cols-2',
				className
			)}
		>
			{children}
		</div>
	)
}

export function QuickLink({ title, description, href, icon, logo, more }) {
	return (
		<div className="group relative flex flex-row gap-8 overflow-hidden rounded-xl border border-gray-200 bg-white bg-gradient-to-b from-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:from-gray-900 dark:to-gray-850">
			<div className="absolute -inset-px rounded-xl border-2 border-transparent opacity-0 transition-all duration-500 [background:linear-gradient(var(--quick-links-hover-bg,theme(colors.pink.50)),var(--quick-links-hover-bg,theme(colors.pink.50)))_padding-box,linear-gradient(to_top,theme(colors.purple.400),theme(colors.pink.400))_border-box] group-hover:opacity-100 dark:[--quick-links-hover-bg:theme(colors.gray.800)]" />
			<div className="relative overflow-hidden rounded-xl p-6">
				{icon && <Icon icon={icon} className="mb-4 h-8 w-8 text-pink-500" />}
				{logo && (
					<span className="mb-4 flex h-8 text-black dark:text-white">
						{logo}
					</span>
				)}
				<h2 className="font-display text-base text-slate-900 dark:text-white">
					<Link href={href}>
						<span className="absolute -inset-px rounded-xl" />
						{title}
					</Link>
				</h2>
				<p className="mt-1 text-sm text-slate-700 dark:text-slate-400">
					{description}
				</p>

				{more && (
					<span className="group mt-8 flex items-center text-sm text-pink-500">
						Learn more{' '}
						<span className="ml-2 inline-block h-4 w-4 transition-all group-hover:translate-x-2">
							<ArrowRightIcon />
						</span>
					</span>
				)}
			</div>
		</div>
	)
}
