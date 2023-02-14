import { Tag } from '@markdoc/markdoc';

import { CTA } from '../src/components/CTA';

export const cta = {
	render: CTA,
	description: 'Display a call to action with actions',
	children: ['paragraph', 'tag', 'list'],
	attributes: {
		title: {
			type: String,
			description: 'The title displayed at the top of the callout',
		},
		primaryActionLabel: {
			type: String,
		},
		primaryActionHref: {
			type: String,
		},
		primaryActionTypeformId: {
			type: String,
		},
		secondaryActionLabel: {
			type: String,
		},
		secondaryActionHref: {
			type: String,
		},
		secondaryActionTypeformId: {
			type: String,
		},
	},
	transform(node: any, config: any) {
		const attributes = node.transformAttributes(config);
		const children = node.transformChildren(config);

		// @ts-ignore
		return new Tag(this.render, { ...attributes }, children);
	},
};
