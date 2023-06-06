import { Callout } from '@/components/Callout';
import { QuickLink, QuickLinks } from '@/components/QuickLinks';
import Video from '../src/components/Video';
import { cta } from './cta.markdoc';
import { Deploy } from '../src/components/Deploy';
import { DeployButtonGenerator } from '../src/components/DeployButtonGenerator';

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
		attributes: {
			className: { type: String },
		},
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
	youtube: {
		selfClosing: true,
		attributes: {
			id: { type: String, required: true },
			className: { type: String },
		},
		render: ({ id, className }) => {
			return (
				<iframe
					width="560"
					height="315"
					src={`https://www.youtube-nocookie.com/embed/${id}`}
					title="YouTube video player"
					frameBorder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowfullscreen
					style={{ marginBottom: '2rem' }}
					className={className}
				></iframe>
			);
		},
	},
	deploy: {
		attributes: {
			template: { type: String, required: false },
			repository: { type: String, required: false },
		},
		render: Deploy,
	},
	'deploy-button-generator': {
		selfClosing: true,
		render: DeployButtonGenerator,
	},
};

export default tags;
