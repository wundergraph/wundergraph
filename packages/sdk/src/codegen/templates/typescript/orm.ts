import {
	parse,
	visit,
	print,
	Kind,
	NamedTypeNode,
	TypeDefinitionNode,
	FieldDefinitionNode,
	DirectiveDefinitionNode,
	ASTVisitor,
} from 'graphql';

import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { resolveConfigurationVariable } from '../../../configure/variables';
import { formatTypeScript } from './index';
import { schemasTemplate, ormTemplate } from './orm.template';

import Handlebars from 'handlebars';

import { codegen } from '@wundergraph/orm';

// @todo move to utils or import from existing dependency
const toTitleCase = (string: string) => string[0].toUpperCase() + string.substring(1).toLowerCase();

type Renamable = TypeDefinitionNode | FieldDefinitionNode | DirectiveDefinitionNode | NamedTypeNode;

// @todo replace with `Api.renameTypes*` facilities?
const rename =
	(prefix: string) =>
	(node: Renamable): Renamable => {
		if (node.name.value.startsWith(prefix)) {
			return {
				...node,
				name: { ...node.name, value: node.name.value.replace(prefix, '') },
			};
		} else {
			return node;
		}
	};

const Renamer: (prefix: string) => ASTVisitor = (prefix) => ({
	[Kind.INTERFACE_TYPE_DEFINITION]: rename(prefix),
	[Kind.UNION_TYPE_DEFINITION]: rename(prefix),
	[Kind.OBJECT_TYPE_DEFINITION]: rename(prefix),
	[Kind.INPUT_OBJECT_TYPE_DEFINITION]: rename(prefix),
	[Kind.ENUM_TYPE_DEFINITION]: rename(prefix),
	[Kind.SCALAR_TYPE_DEFINITION]: rename(prefix),
	[Kind.FIELD_DEFINITION]: rename(prefix),
	[Kind.DIRECTIVE_DEFINITION]: rename(prefix),
	[Kind.NAMED_TYPE]: rename(prefix),
});

// @note the ORM does not currently support joining across APIs
const JoinStripper: ASTVisitor = {
	[Kind.FIELD_DEFINITION]: (node) => {
		return node.name.value === '_join' ? null : node;
	},
};

export class ORM implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		// Utilize our internal GraphQL API URL
		const baseUrl = resolveConfigurationVariable(generationConfig.config.nodeOptions.nodeInternalUrl);

		// @todo support non-namespaced APIs in an implicit "default" namespace
		// @todo merge all non-namespaced API's into a single schema artifact
		// @todo may be best to generate only interface files

		// Collect namespaces that will be exposed through the ORM
		const namespaces = generationConfig.config.application.Apis.filter((api) => Boolean(api.Namespace)).map((api) => ({
			id: api.Namespace,
			name: toTitleCase(api.Namespace!),
		}));

		// generate the schema for the ORM
		const schemas = generationConfig.config.application.Apis.filter((api) => Boolean(api.Namespace))
			.map((api) => {
				const unNamespacedSchema = print(visit(visit(parse(api.Schema), Renamer(`${api.Namespace!}_`)), JoinStripper));
				return [api.Namespace!, codegen(unNamespacedSchema)];
			})
			.map(([namespace, schema]) => ({
				path: `orm/schemas/${namespace}.ts`,
				content: formatTypeScript(schema),
				header: doNotEditHeader,
			}));

		// generate the pre-configured ORM client
		const schemasIndex = Handlebars.compile(schemasTemplate)({ namespaces });
		const orm = Handlebars.compile(ormTemplate)({ baseUrl, namespaces });

		return Promise.resolve([
			...schemas,
			{
				path: 'orm/schemas/index.ts',
				content: formatTypeScript(schemasIndex),
				header: doNotEditHeader,
			},
			{
				path: 'orm/index.ts',
				content: formatTypeScript(orm),
				header: doNotEditHeader,
			},
		]);
	}
}
