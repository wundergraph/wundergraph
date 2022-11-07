// import useSWR from 'swr';
// import useSWRMutation from 'swr/mutation';

export { createHooks, userSWRKey } from './hooks';

export { WunderGraphProvider, useWunderGraphContext } from './context';

export type {
	UseMutationOptions,
	UseSubscriptionOptions,
	UseQueryOptions,
	SSRCache,
	WunderGraphContextValue,
} from './types';

export { SWRConfig, useSWRConfig } from 'swr';

// export type { SWRConfiguration } from 'swr';

// export type { SWRMutationConfiguration } from 'swr/mutation';

// export { useSWR, useSWRMutation };
