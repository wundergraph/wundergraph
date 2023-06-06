import Handlebars from 'handlebars';
import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { isWellKnownClaim } from '../../../graphql/operations';
import { formatTypeScript } from './index';
import { handlebarTemplate } from './claims.template';
export class TypeScriptClaims implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);
		const claims = generationConfig.config.authentication.customClaims;
		const customClaims = Object.entries(claims).map(([key, claim]) => {
			let claimType: string;
			switch (claim.type ?? 'string') {
				case 'string':
					claimType = 'string';
					break;
				case 'int':
					claimType = 'number';
					break;
				case 'float':
					claimType = 'number';
					break;
				case 'boolean':
					claimType = 'boolean';
					break;
				case 'any':
					claimType = 'any';
					break;
				default:
					throw new Error(`unhandled custom claim type ${claim.type}`);
			}
			return {
				name: key,
				required: claim.required ?? true,
				type: claimType,
			};
		});
		const publicPaths = generationConfig.config.authentication.publicClaims.filter((claim) => !isWellKnownClaim(claim));
		// Claim paths have already been validated, so a match a guaranteed
		const publicFields = publicPaths.map((path) =>
			Object.keys(claims).find((claimName) => claims[claimName].jsonPath == path)
		);
		const publicPick = publicFields.map((s) => `"${s}"`).join(' | ');
		const content = tmpl({
			customClaims: customClaims,
			hasPublicCustomClaims: publicPick.length > 0,
			publicCustomClaims: publicPick,
		});
		return Promise.resolve([
			{
				path: 'claims.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}
