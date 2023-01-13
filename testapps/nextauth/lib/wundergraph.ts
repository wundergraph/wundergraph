import { createWunderGraphNext } from '../components/generated/nextjs';

const { client, withWunderGraph, useQuery, useMutation, useSubscription, useUser, useAuth, useFileUpload } =
	createWunderGraphNext({
		baseURL: 'http://localhost:3000/api/wg',
		ssr: true,
	});

export { client, withWunderGraph, useQuery, useMutation, useSubscription, useUser, useAuth, useFileUpload };
