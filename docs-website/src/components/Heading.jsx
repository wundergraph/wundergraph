import * as React from 'react'
import { useRouter } from 'next/router'

export function Heading({ id = '', level = 1, children, className }) {
	const router = useRouter()
	const Component = `h${level}`

	const link = (
		// @ts-ignore
		<Component
			className={['heading', 'scroll-mt-2.5', className]
				.filter(Boolean)
				.join(' ')}
			id={id}
		>
			{children}
			<style jsx>
				{`
					a {
						text-decoration: none;
					}
					a:hover {
						opacity: 1;
					}
				`}
			</style>
		</Component>
	)

	return id && level !== 1 ? (
		<a href={`#${id}`}>
			{link}
			<style jsx>
				{`
					a {
						text-decoration: none;
					}
					a:hover {
						opacity: 1;
					}
					a :global(.heading::after) {
						opacity: 0;
						color: var(--toc-border);
						content: '  #';
						transition: opacity 250ms ease;
					}
					a :global(.heading:hover::after) {
						opacity: 1;
					}
				`}
			</style>
		</a>
	) : (
		link
	)
}
