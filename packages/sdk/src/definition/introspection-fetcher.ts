import axiosRetry from 'axios-retry';
import axios, { AxiosError, AxiosInstance, AxiosStatic } from 'axios';

let axiosInstance: AxiosInstance | AxiosStatic | undefined;

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
				return error.response.status >= 500;
			}
			return axiosRetry.isNetworkError(error);
		},
	});

	return instance;
};
