import { createWunderGraphNext } from '../components/generated/nextjs';

const wg = createWunderGraphNext({
	ssr: true,
});

const { client, withWunderGraph, useQuery, useMutation, useSubscription, useUser, useAuth, useFileUpload } = wg;

export { client, withWunderGraph, useQuery, useMutation, useSubscription, useUser, useAuth, useFileUpload };
