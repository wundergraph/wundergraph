//language=handlebars
export const handlebarTemplate = `
import { withWunderGraph, createHooks, WithWunderGraphOptions, SSRCache } from '@wundergraph/nextjs';
import { User } from '@wundergraph/sdk/client';
import { createClient, Operations, UserRole } from './client';

export interface WunderGraphPageProps {
    ssrCache?: SSRCache,
    user?: User<UserRole>
}

export interface CreateWunderGraphNextOptions extends Omit<WithWunderGraphOptions, 'client'> {
	baseURL?: string;
}

export const createWunderGraphNext = (options: CreateWunderGraphNextOptions) => {
    const { baseURL, ...rest } = options;

    const client = createClient(baseURL ? {
        baseURL
    } : undefined);

    const hooks = createHooks<Operations>(client);

    const _withWunderGraph = withWunderGraph({
        client,
        ...rest
    });

    return {
        withWunderGraph: _withWunderGraph,
        client,
        ...hooks
    }
}
`;
