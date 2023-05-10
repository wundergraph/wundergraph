import { NextSeo, NextSeoProps } from 'next-seo';
import { useRouter } from 'next/router';
import Head from 'next/head';

export interface SEOProps extends Pick<NextSeoProps, 'title' | 'description' | 'additionalLinkTags'> {
	image?: string;
}

const siteBaseUrl = process.env.NODE_ENV === 'production' ? 'https://docs.wundergraph.com' : 'http://localhost:3005';

const Seo = ({ title, description, image, ...rest }: SEOProps) => {
	const router = useRouter();

	return (
		<>
			<Head>
				<meta content="en" httpEquiv="Content-Language" />
			</Head>
			<NextSeo
				title={title}
				description={description}
				twitter={{
					cardType: 'summary_large_image',
					site: '@wundergraphcom',
				}}
				openGraph={{
					type: 'website',
					title,
					description,
					url: `${siteBaseUrl}${router.asPath}`,
					locale: 'en_US',
					site_name: 'WunderGraph Docs',
					images: [
						{
							url: siteBaseUrl + '/api/og?title=' + title,
							width: 1200,
							height: 675,
							alt: description,
						},
					],
				}}
				titleTemplate="%s - WunderGraph Docs"
				{...rest}
			/>
		</>
	);
};

export default Seo;
