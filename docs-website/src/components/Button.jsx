import Link from 'next/link'
import clsx from 'clsx'

const styles = {
	primary:
		'px-6 py-2 flex justify-center items-center space-x-3 rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-900 bg-sky-500 text-white border-sky-500 hover:bg-sky-500 dark:bg-sky-600 dark:border-sky-700 dark:hover:bg-sky-500 dark:hover:border-sky-600',
	secondary:
		'px-6 py-2 flex justify-center items-center space-x-3 rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-900 bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-500/30 dark:bg-sky-500/20',
}

export function Button({ variant = 'primary', className, href, ...props }) {
	className = clsx(styles[variant], className)

	return href ? (
		<Link href={href} className={className} {...props} />
	) : (
		<button className={className} {...props} />
	)
}
