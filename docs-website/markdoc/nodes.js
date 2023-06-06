import { Fence } from '@/components/Fence';
import Link from 'next/link';
import { ExternalLinkIcon } from '../src/components/icons/ExternalLinkIcon';
import { Heading } from '../src/components/Heading';
import { Tag } from '@markdoc/markdoc';
import tags from '../config/tags';

import { isExternalUrl } from '@/utils/helpers';

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

const nodes = {
	document: {
		render: undefined,
	},
	heading: {
		render: Heading,
		children: ['inline'],
		attributes: {
			id: { type: String },
			level: { type: Number, required: true, default: 1 },
			className: { type: String },
		},
		transform(node, config) {
			const attributes = node.transformAttributes(config);
			const children = node.transformChildren(config);
			const id = generateID(children, attributes);

			return new Tag(this.render, { ...attributes, id }, children);
		},
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
	table: {
		render: (props) => (
			<div className="overflow-x-auto">
				<table {...props} />
			</div>
		),
	},
	paragraph: {
		transform: (node, config) => {
			const attributes = node.transformAttributes(config);
			const children = node.transformChildren(config);
			while (true) {
				let tagMatch = '';
				const i = children.findIndex((child) => {
					if (typeof child !== 'string') {
						return false;
					}
					return Object.keys(tags).find((tag) => {
						tagMatch = tag;
						return child.match(tag);
					});
				});
				if (i === -1) {
					break;
				}
				const original = children[i];
				const parts = original.split(tagMatch);
				const transformed = [
					parts[0],
					new Tag(
						'Link',
						{
							href: tags[tagMatch],
						},
						[tagMatch]
					),
					parts[1],
				];
				children.splice(i, 1, ...transformed);
			}
			return new Tag('p', attributes, children);
		},
	},
	code: {
		transform: (node, config) => {
			const content = node.attributes.content;
			const codeTag = new Tag('code', node.attributes, [content]);
			const match = Object.keys(tags).find((tag) => tag === content);
			if (match) {
				return new Tag(
					'Link',
					{
						href: tags[content],
					},
					[codeTag]
				);
			}
			return codeTag;
		},
	},
	fence: {
		render: Fence,
		attributes: {
			language: {
				type: String,
			},
			filename: {
				type: String,
				required: true,
			},
		},
	},
	link: {
		render: ({ children, href, ...rest }) => {
			const isExternal = isExternalUrl(href);

			let target;
			if (isExternal) {
				target = '_blank';
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
			);
		},
		attributes: {
			href: {
				type: String,
			},
		},
	},
};

export default nodes;
