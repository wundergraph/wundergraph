//language=handlebars
export const handlebarTemplate = `
import { DATA_SOURCES } from './wundergraph.hooks'

declare module '@wundergraph/sdk/dynamic-router' {
	export interface RouteMatcher {
		datasources?: DATA_SOURCES[]
	}
}
`;
