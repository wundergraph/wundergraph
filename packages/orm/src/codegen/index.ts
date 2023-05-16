import { parse, buildSchema, visit, GraphQLEnumType, Kind, OperationTypeNode } from 'graphql';
import type { Code } from 'ts-poet';
import prettier from 'prettier';

import { printType, stringifyAST } from './utils';
import { transform } from './types';

export const codegen = (sdl: string) => {
	const ast = parse(sdl, { noLocation: true });
	const schema = buildSchema(sdl);

	const visitor = transform(ast, schema);
	// our visitor maps `graphql` nodes to `ts-poet` nodes
	const result = visit(ast, visitor) as unknown as { readonly definitions: Code[] };

	const types = Object.values(schema.getTypeMap()).filter((type) => !type.name.startsWith('__'));

	const enumValues = new Set(
		Object.values(schema.getTypeMap())
			.filter((type) => type instanceof GraphQLEnumType)
			.flatMap((type) => (type as GraphQLEnumType).getValues().map((value) => value.value))
	);

	const ENUMS = `
    Object.freeze({
      ${Array.from(enumValues)
				.map((value) => `${value}: true`)
				.join(',\n')}
    } as const)
  `;

	const typeMap = `
    export interface Schema {
      ${types.map(printType).join('\n')}
    }
  `;

	const source =
		`
    import { buildASTSchema, Kind, OperationTypeNode } from 'graphql'

     ` +
		`
    export const SCHEMA = buildASTSchema(${stringifyAST(ast)})

    export const ENUMS = ${ENUMS}

    ${typeMap}
  ` +
		result.definitions.map((code) => code.toString()).join('\n');

	return prettier.format(source, { parser: 'typescript' });
};
