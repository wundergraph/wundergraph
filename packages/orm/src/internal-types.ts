/**
 * Type compatible with WunderGraph's server ClientRequest, to pass
 * it around to the Executor.
 */
export interface ClientRequest {
	method: string;
	requestURI: string;
	headers: Headers;
}
