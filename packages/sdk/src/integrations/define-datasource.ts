import { HasRequiredKeys } from 'type-fest';
import { WunderGraphDatasource } from './types';

type DefineDataSource<Config extends object> = HasRequiredKeys<Config> extends true
	? (config: Config) => WunderGraphDatasource
	: (config?: Config) => WunderGraphDatasource;

export const defineDatasource = <Config extends object>(datasource: DefineDataSource<Config>) => {
	return datasource;
};
