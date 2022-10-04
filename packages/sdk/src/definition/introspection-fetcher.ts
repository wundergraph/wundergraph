import { getConfig, attach } from 'retry-axios';
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

	instance.defaults.raxConfig = {
		instance: instance,
		backoffType: 'exponential',
		retry: 5,
		noResponseRetries: 2,
		httpMethodsToRetry: ['GET', 'POST'],
		onRetryAttempt: (err: AxiosError) => {
			const cfg = getConfig(err);
			console.log(
				`failed to perform request method: ${err.request.method} url: ${err.request.url}.${
					cfg ? `Retry attempt #${cfg.currentRetryAttempt}` : ''
				}`
			);
		},
	};
	attach(instance);

	return instance;
};
