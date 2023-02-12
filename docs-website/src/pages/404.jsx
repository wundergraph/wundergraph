import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import Link from 'next/link';

export default function NotFoundPage() {
	return (
		<div className="space-y-8">
			<div className="stretch flex flex-col lg:flex-row lg:items-end lg:justify-end">
				<div className="flex-1">
					<Heading>Whoops, page not found</Heading>
					<Paragraph className="max-w-xl text-xl">
						We couldn&apos;t find what you&apos;re looking for. Try searching for it or go{' '}
						<Link href="/">back to the homepage</Link>.
					</Paragraph>
				</div>
			</div>
		</div>
	);
}
