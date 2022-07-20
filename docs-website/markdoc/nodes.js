import { Fence } from '@/components/Fence'
import Link from 'next/link'
import { ExternalLinkIcon } from '../src/components/icons/ExternalLinkIcon'

const nodes = {
	document: {
		render: undefined,
	},
	th: {
		attributes: {
			scope: {
				type: String,
				default: 'col',
			},
		},
		render: (props) => <th {...props} />,
	},
	fence: {
		render: Fence,
		attributes: {
			language: {
				type: String,
			},
		},
	},
	link: {
		render: ({ children, href, ...rest }) => {
			const isExternal = href.match(/^http/)

			let target
			if (isExternal) {
				target = '_blank'
			}

			return (
				<Link href={href} target={target} {...rest}>
					{children}
					{isExternal && (
						<>
							{' '}
							<ExternalLinkIcon className="-mt-1" />
						</>
					)}
				</Link>
			)
		},
		attributes: {
			href: {
				type: String,
			},
		},
	},
}

export default nodes
