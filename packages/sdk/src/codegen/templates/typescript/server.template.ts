//language=handlebars
export const template = `
import type { CustomClaims } from "./claims";
import type {
	BaseRequestContext,
	WunderGraphUser,
} from "@wundergraph/sdk/server";

export type Role = {{{ roleDefinitions }}};

export interface User extends WunderGraphUser<Role, CustomClaims> {}

export interface GraphQLExecutionContext {
    wundergraph: BaseRequestContext
}
`;
