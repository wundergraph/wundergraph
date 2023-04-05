import * as React from 'react';
import ssrPrepass from 'react-ssr-prepass';
import { NextComponentType } from 'next';
import { AppContextType, AppPropsType, NextPageContext } from 'next/dist/shared/lib/utils';
import { NextRouter } from 'next/router';
import { ResponseError, User } from '@wundergraph/sdk/client';
import { userSWRKey, SWRConfig } from '@wundergraph/swr';
import { WithWunderGraphOptions, SSRCache } from './types';
import { WunderGraphProvider } from './context';
import { SSRMiddleWare } from './ssr-middleware';

export const withWunderGraph = (options: WithWunderGraphOptions) => {
	return (
		AppOrPage: NextComponentType<any, any, any>,
		overrideOptions?: Partial<WithWunderGraphOptions>
	): NextComponentType => {
		const _options = {
			...options,
			...overrideOptions,
		};
		const {
			client,
			userCacheKey = userSWRKey,
			context,
			ssr,
			fetchUserSSR,
			logPrerenderTime,
			logFetchErrors,
			use = [],
		} = _options;

		const WithWunderGraph = (props: AppPropsType<NextRouter, any> & { ssrCache: SSRCache; user: User }) => {
			const { ssrCache = {}, user } = props;
			const providerProps = { context, ssrCache, ssr, client, user };
			return (
				<WunderGraphProvider {...providerProps}>
					<SWRConfig value={{ fallback: ssrCache, use: [SSRMiddleWare, ...use] }}>
						<AppOrPage {...props} />
					</SWRConfig>
				</WunderGraphProvider>
			);
		};

		if (AppOrPage.getInitialProps || ssr) {
			WithWunderGraph.getInitialProps = async (appOrPageCtx: AppContextType) => {
				const AppTree = appOrPageCtx.AppTree;
				const isApp = !!appOrPageCtx.Component;
				const ctx = isApp ? appOrPageCtx.ctx : (appOrPageCtx as any as NextPageContext);

				const ssrCache: SSRCache = {};

				let pageProps: Record<string, unknown> = {};
				if (AppOrPage.getInitialProps) {
					const originalProps = await AppOrPage.getInitialProps(appOrPageCtx);

					const originalPageProps = isApp ? originalProps.pageProps ?? {} : originalProps;

					pageProps = {
						...originalPageProps,
						...pageProps,
					};
				}

				const getAppTreeProps = (props: Record<string, unknown>) => (isApp ? { pageProps: props } : props);

				if (typeof window !== 'undefined' || !ssr) {
					// we're on the client
					// no need to do all the SSR stuff.
					return getAppTreeProps({ ...pageProps, ssrCache });
				}

				const cookieHeader = ctx.req?.headers.cookie;
				if (typeof cookieHeader === 'string') {
					client.setExtraHeaders({
						Cookie: cookieHeader,
					});
				}

				let ssrUser: User | null = null;

				if (fetchUserSSR !== false) {
					try {
						ssrUser = await client.fetchUser();
					} catch (e: any) {
						if ((e instanceof ResponseError && e.statusCode !== 404 && e.statusCode !== 401) || logFetchErrors)
							console.error('[WunderGraph] Unable to fetch user for SSR', e);
					}
				}

				const start = logPrerenderTime ? process.hrtime() : undefined;

				if (ssrUser) {
					ssrCache[userCacheKey] = ssrUser;
				}

				const prepassProps = {
					pageProps: {
						ssrCache,
						user: ssrUser,
						...pageProps,
					},
				};

				await ssrPrepass(<AppTree {...prepassProps} />);

				const keys = Object.keys(ssrCache)
					.filter((key) => typeof ssrCache[key].then === 'function')
					.map((key) => ({
						key,
						value: ssrCache[key],
					})) as { key: string; value: Promise<any> }[];
				if (keys.length !== 0) {
					const promises = keys.map((key) => {
						// We swallow errors here, since there is no official way to pass errors back to the SWR fallback.
						// Unless we use our own cache instance, but that might break compatibility with other apps.
						return key.value.catch((e) => {
							if (logFetchErrors) console.error(e);
						});
					});
					const results = await Promise.all(promises);
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i].key;
						if (results[i]) ssrCache[key] = results[i];
					}
				}

				if (logPrerenderTime && start) {
					const precision = 3; // 3 decimal places
					const elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
					console.log(process.hrtime(start)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - render'); // print message + time
				}

				return getAppTreeProps({ ...pageProps, ssrCache, user: ssrUser });
			};
		}

		WithWunderGraph.displayName = AppOrPage.displayName || AppOrPage.name || 'WithWunderGraph';
		if ((AppOrPage as any).getLayout) {
			// @ts-ignore
			WithWunderGraph.getLayout = AppOrPage.getLayout;
		}

		return WithWunderGraph as any;
	};
};
