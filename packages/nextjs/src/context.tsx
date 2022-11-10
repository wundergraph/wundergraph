import React from 'react';

import { WunderGraphContextValue } from './types';

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

export const WunderGraphProvider = (props: any) => {
	const { children, context, value } = props;

	const { Provider } = getWunderGraphContext(context);

	return <Provider value={value}>{children}</Provider>;
};
