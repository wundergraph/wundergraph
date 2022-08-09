/**
 * Important: This file must be compatible with Next.js https://nextjs.org/docs/api-reference/edge-runtime
 */

import type { NextPage, NextPageContext, NextComponentType } from 'next';
import type NextApp from 'next/app';
import React, { createElement, ReactElement, ReactNode, Context } from 'react';
import ssrPrepass from 'react-ssr-prepass';

import type { User, WunderGraphClient } from '@wundergraph/sdk/client';

import { WunderGraphContextProperties, WunderGraphProvider, WunderGraphProviderOptions } from '@wundergraph/react';

export interface WithWunderGraphOptions<Role> {
	client: WunderGraphClient<Role>;
	logPrerenderTime?: boolean;
	disableFetchUserServerSide?: boolean;
	disableFetchUserClientSide?: boolean;
	disableFetchUserOnWindowFocus?: boolean;
	context?: Context<WunderGraphContextProperties<Role> | undefined>;
	authenticationEnabled?: boolean;
}

type NextPageWithLayout = NextPage & {
	getLayout?: (page: ReactElement) => ReactNode;
};

export function withWunderGraph<Role>(Page: NextComponentType<any, any, any>, options: WithWunderGraphOptions<Role>) {
	const WithWunderGraph: NextComponentType<any, any, any> = (props: any) => {
		const isClient = typeof window !== 'undefined';
		let providerProps: WunderGraphProviderOptions<Role> = {
			client: options.client,
			user: props.user || null,
			ssrCache: props.ssrCache || (isClient ? { _client_defined_cache: true } : {}),
			context: options.context,
		};

		return (
			<WunderGraphProvider {...providerProps}>
				<Page {...props} />
			</WunderGraphProvider>
		);
	};
	WithWunderGraph.displayName = (Page as any).displayName || (Page as NextPage).name || 'WithWunderGraph';
	if ((Page as NextPageWithLayout).getLayout) {
		// @ts-ignore
		WithWunderGraph.getLayout = (Page as NextPageWithLayout).getLayout;
	}
	WithWunderGraph.getInitialProps = async (ctx: NextPageContext) => {
		const pageProps = (Page as NextPage).getInitialProps ? await (Page as NextPage).getInitialProps!(ctx as any) : {};
		const ssrCache: { [key: string]: any } = { test: false };

		if (typeof window !== 'undefined' || !options?.client) {
			// we're on the client
			// no need to do all the SSR stuff
			return { ...pageProps, ssrCache };
		}

		const cookieHeader = ctx.req?.headers.cookie;
		if (typeof cookieHeader === 'string') {
			options.client.setExtraHeaders({
				Cookie: cookieHeader,
			});
		}

		let ssrUser: User<Role> | null = null;

		if (options?.disableFetchUserServerSide !== true && options.authenticationEnabled) {
			try {
				ssrUser = await options.client.fetchUser();
			} catch (e) {}
		}

		const AppTree = ctx.AppTree;
		const start = options?.logPrerenderTime ? process.hrtime() : undefined;

		const App = createElement(
			WunderGraphProvider,
			{
				user: ssrUser,
				ssrCache,
				client: options.client,
				context: options.context,
			} as any,
			createElement(AppTree, {
				pageProps: {
					...pageProps,
					ssrCache,
					user: ssrUser,
				},
			})
		);

		await ssrPrepass(App);
		const keys = Object.keys(ssrCache)
			.filter((key) => typeof ssrCache[key].then === 'function')
			.map((key) => ({
				key,
				value: ssrCache[key],
			})) as { key: string; value: Promise<any> }[];
		if (keys.length !== 0) {
			const promises = keys.map((key) => key.value);
			const results = await Promise.all(promises);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i].key;
				ssrCache[key] = results[i];
			}
		}

		if (options?.logPrerenderTime && start) {
			const precision = 3; // 3 decimal places
			const elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
			console.log(process.hrtime(start)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - render'); // print message + time
		}

		return { ...pageProps, ssrCache, user: ssrUser };
	};
	return WithWunderGraph;
}
