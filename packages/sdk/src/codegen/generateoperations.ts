import { FieldConfig, OperationsGenerationConfig } from '../configure/codegeneration';
import { ResolvedApplication, ResolvedWunderGraphConfig } from '../configure';
import path from 'path';
import fs from 'fs';
import { buildOperationNodeForField, Maybe } from '@graphql-tools/utils';
import { buildSchema, GraphQLObjectType, OperationTypeNode, print, visit } from 'graphql';

export interface GenerateConfig {
	app: ResolvedApplication;
	wgDirAbs: string;
	operationGenerationConfig: OperationsGenerationConfig;
	resolved: ResolvedWunderGraphConfig;
	fields: FieldConfig[];
	basePath: string;
}

export const generateOperations = async (config: GenerateConfig) => {
	const generateOperationsFilePath = path.join(config.wgDirAbs, 'generated', 'generate.operations.json');
	const generatedFiles: string[] = [];
	const schema = buildSchema(config.resolved.application.EngineConfiguration.Schema, {
		assumeValid: true,
		assumeValidSDL: true,
	});
	for (const field of config.fields) {
		const operationDir = path.join(config.wgDirAbs, 'operations', config.basePath, field.apiNamespace);
		if (!fs.existsSync(operationDir)) {
			fs.mkdirSync(operationDir, { recursive: true });
		}

		const options = config.operationGenerationConfig.getOptions(field.apiNamespace);

		let operationNode = buildOperationNodeForField({
			field: field.name,
			schema,
			kind: field.operationType as OperationTypeNode,
			...options,
		});
		let opType: Maybe<GraphQLObjectType>;
		if (field.operationType === OperationTypeNode.QUERY) {
			opType = schema.getQueryType();
		} else if (field.operationType === OperationTypeNode.MUTATION) {
			opType = schema.getMutationType();
		} else if (field.operationType === OperationTypeNode.SUBSCRIPTION) {
			opType = schema.getSubscriptionType();
		}
		const matchedField = (opType?.getFields() || {})[field.name];
		if (matchedField) {
			operationNode = visit(operationNode, {
				VariableDefinition: {
					leave: (node, key, parent, path, ancestors) => {
						const variableName = node.variable.name.value;
						const matchingArg = (matchedField?.args || []).find((arg) => arg.name === variableName);
						const defaultValue = matchingArg?.astNode?.defaultValue;
						return {
							...node,
							defaultValue,
						};
					},
				},
			});
		}
		const operationContent = operationsHeader + print(operationNode);
		const operationFilePath = buildFieldPath(config, field);
		generatedFiles.push(operationFilePath);
		if (fs.existsSync(operationFilePath)) {
			const existing = fs.readFileSync(operationFilePath, 'utf-8');
			if (existing === operationContent) {
				// skip writing if the content is the same
				continue;
			}
			if (!existing.startsWith(operationsHeader)) {
				// skip writing if the file is customized
				continue;
			}
		}
		fs.writeFileSync(operationFilePath, operationContent, { encoding: 'utf-8' });
	}
	if (!fs.existsSync(generateOperationsFilePath)) {
		fs.writeFileSync(generateOperationsFilePath, JSON.stringify(generatedFiles, null, 2));
		return;
	}
	const oldFiles = JSON.parse(fs.readFileSync(generateOperationsFilePath, 'utf-8')) as string[];
	fs.writeFileSync(generateOperationsFilePath, JSON.stringify(generatedFiles, null, 2));
	const directories = new Set<string>();
	for (const file of oldFiles) {
		if (generatedFiles.includes(file)) {
			// don't delete files that are still generated
			continue;
		}
		if (!fs.existsSync(file)) {
			// file was deleted manually
			continue;
		}
		const content = fs.readFileSync(file, 'utf-8');
		if (!content.startsWith(operationsHeader)) {
			// file was customized
			continue;
		}
		fs.rmSync(file, { force: true });
		directories.add(path.dirname(file));
	}
	for (const dir of directories) {
		// check if the directory is empty
		if (fs.readdirSync(dir).length !== 0) {
			continue;
		}
		fs.rmdirSync(dir);
	}
};

const operationsHeader =
	'# This file is auto generated.\n# Remove/modify this header if you want to customize the operation.\n';

const buildFieldPath = (config: GenerateConfig, field: FieldConfig) => {
	// If the namespace is empty, there is no underscore to remove
	const substringIndex = field.apiNamespace.length ? field.apiNamespace.length + 1 : 0;
	const fileName = field.name.substring(substringIndex) + '.graphql';
	return path.join(
		config.wgDirAbs,
		'operations',
		config.basePath,
		field.apiNamespace,
		fileName[0].toUpperCase() + fileName.substring(1)
	);
};
