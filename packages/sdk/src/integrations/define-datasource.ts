import { HasRequiredKeys } from 'type-fest';
import { WunderGraphDatasource } from './types';

export type DefineDataSource<Config extends object> = HasRequiredKeys<Config> extends true
	? (config: Config) => WunderGraphDatasource
	: (config?: Config) => WunderGraphDatasource;

export type { WunderGraphDatasource } from './types';

export const defineDatasource = <Config extends object>(datasource: DefineDataSource<Config>) => {
	return datasource;
};
