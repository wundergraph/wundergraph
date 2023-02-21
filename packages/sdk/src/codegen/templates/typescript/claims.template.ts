//language=handlebars
export const handlebarTemplate = `
export interface CustomClaims {
	{{#each customClaims}}
	{{name}}?: {{type}};
	{{/each}}
}
`;
