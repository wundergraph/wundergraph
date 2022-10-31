import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

export { createHooks } from './hooks';

export type { UseMutationOptions, UseSubscriptionOptions, UseQueryOptions } from './types';

export { SWRConfig, useSWRConfig } from 'swr';

export type { SWRConfiguration } from 'swr';

export type { SWRMutationConfiguration } from 'swr/mutation';

export { useSWR, useSWRMutation };
