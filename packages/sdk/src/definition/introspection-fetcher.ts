import axiosRetry from 'axios-retry';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Logger } from '../logger/logger';

let axiosInstance: AxiosInstance | undefined;

export const Fetcher = (): AxiosInstance => {
	if (axiosInstance) {
		return axiosInstance;
	}

	axiosInstance = initAxios();
	return axiosInstance;
};

const initAxios = (): AxiosInstance => {
	const instance = axios.create();

	axiosRetry(instance, {
		retries: 5,
		retryDelay: axiosRetry.exponentialDelay,
		retryCondition: (error: AxiosError) => {
			if (error.response) {
				return error.response.status >= 400;
			}
			return true;
		},
		onRetry: (retryCount, error, requestConfig) => {
			Logger().error(
				`failed to perform introspection request method: ${requestConfig.method} url: ${requestConfig.url}. Retry attempt #${retryCount}`
			);
		},
	});

	return instance;
};
