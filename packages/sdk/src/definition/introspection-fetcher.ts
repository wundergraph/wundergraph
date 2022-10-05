import axiosRetry from 'axios-retry';
import axios, { AxiosError, AxiosInstance } from 'axios';

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
			return !error.response;
		},
		onRetry: (retryCount, error, requestConfig) => {
			console.log(
				`failed to perform request method: ${requestConfig.method} url: ${requestConfig.url}. Retry attempt #${retryCount}`
			);
		},
	});

	return instance;
};
