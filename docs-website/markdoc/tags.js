import { Callout } from '@/components/Callout';
import { QuickLink, QuickLinks } from '@/components/QuickLinks';
import Video from '../src/components/Video';
import { cta } from './cta.markdoc';

const tags = {
	callout: {
		attributes: {
			title: { type: String },
			type: {
				type: String,
				default: 'note',
				matches: ['note', 'warning'],
				errorLevel: 'critical',
			},
		},
		render: Callout,
	},
	video: {
		render: Video,
		children: ['inline'],
		attributes: {
			src: { type: String, required: true },
			className: { type: String },
			autoPlay: { type: Boolean },
			muted: { type: Boolean },
			playsInline: { type: Boolean },
			loop: { type: Boolean },
			controls: { type: Boolean },
		},
	},
	figure: {
		selfClosing: true,
		attributes: {
			src: { type: String },
			alt: { type: String },
			caption: { type: String },
		},
		render: ({ src, alt = '', caption }) => (
			<figure>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={src} alt={alt} />
				<figcaption>{caption}</figcaption>
			</figure>
		),
	},
	'quick-links': {
		render: QuickLinks,
	},
	'quick-link': {
		selfClosing: true,
		render: QuickLink,
		attributes: {
			title: { type: String },
			description: { type: String },
			icon: { type: String },
			href: { type: String },
		},
	},
	cta,
};

export default tags;
