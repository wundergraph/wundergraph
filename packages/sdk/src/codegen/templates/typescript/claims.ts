import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { formatTypeScript } from './index';
import Handlebars from 'handlebars';
import { handlebarTemplate } from './claims.template';

export class TypeScriptClaims implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);
		const customClaims = Object.keys(generationConfig.config.authentication.customClaims ?? []).map((key) => {
			const claim = generationConfig.config.authentication.customClaims[key];
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
			}
			return {
				name: key,
				required: claim.required ?? true,
				type: claimType,
			};
		});
		const content = tmpl({
			customClaims: customClaims,
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
