//language=handlebars
export const handlebarTemplate = `
export interface CustomClaims {
	{{#each customClaims}}
	{{name}}?: {{type}};
	{{/each}}
}
export type PublicCustomClaims = {{#if hasPublicCustomClaims}}Pick<CustomClaims, {{{ publicCustomClaims }}}>{{ else }}CustomClaims{{/if}};
`;
