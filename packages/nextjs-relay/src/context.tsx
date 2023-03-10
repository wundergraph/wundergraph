import React from 'react';

import { WunderGraphContextValue, WunderGraphProviderProps } from './types';

const defaultContext = React.createContext<WunderGraphContextValue | null>(null);

const getWunderGraphContext = (context?: React.Context<WunderGraphContextValue | null>) => {
	if (context) {
		return context;
	}
	return defaultContext;
};

export const useWunderGraphContext = (context?: React.Context<WunderGraphContextValue | null>) => {
	return React.useContext(getWunderGraphContext(context));
};

export const WunderGraphProvider = (props: WunderGraphProviderProps) => {
	const { children, context, client, ssrCache = {}, ssr = true, user } = props;
	const { Provider } = getWunderGraphContext(context);
	return <Provider value={{ client, ssrCache, user, ssr }}>{children}</Provider>;
};
