import { FieldConfig, OperationsGenerationConfig } from '../configure/codegeneration';
import { ResolvedApplication, ResolvedWunderGraphConfig } from '../configure';
import path from 'path';
import fs from 'fs';
import { buildOperationNodeForField } from '@graphql-tools/utils';
import { buildSchema, OperationTypeNode, print } from 'graphql';

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
	const remove: FieldConfig[] = [];
	const upsert: FieldConfig[] = [];
	const update = JSON.stringify(config.operationGenerationConfig.rootFields);
	if (fs.existsSync(generateOperationsFilePath)) {
		const data = fs.readFileSync(generateOperationsFilePath, 'utf-8');
		const existingFields = JSON.parse(data) as FieldConfig[];
		for (const field of existingFields) {
			if (
				!config.operationGenerationConfig.rootFields.find(
					(f) => f.rootFieldName === field.rootFieldName && f.namespace === field.namespace
				)
			) {
				remove.push(field);
				continue;
			}
			upsert.push(field);
		}
	} else {
		upsert.push(...config.operationGenerationConfig.rootFields);
	}
	fs.writeFileSync(generateOperationsFilePath, update, 'utf-8');
	for (const field of remove) {
		const fieldPath = buildFieldPath(config, field);
		if (fs.existsSync(fieldPath)) {
			const fileContents = fs.readFileSync(fieldPath, 'utf-8');
			if (!fileContents.startsWith(operationsHeader)) {
				// skip deleting customized files
				continue;
			}
			fs.rmSync(fieldPath, { force: true });
		}
	}
	const schema = buildSchema(config.resolved.application.EngineConfiguration.Schema, {
		assumeValid: true,
		assumeValidSDL: true,
	});
	for (const field of upsert) {
		const operationDir = path.join(config.wgDirAbs, 'operations', config.basePath, field.namespace);
		if (!fs.existsSync(operationDir)) {
			fs.mkdirSync(operationDir, { recursive: true });
		}
		const operationNode = buildOperationNodeForField({
			field: field.rootFieldName,
			schema,
			kind: field.operationType as OperationTypeNode,
		});
		const operationContent = operationsHeader + print(operationNode);
		const operationFilePath = buildFieldPath(config, field);
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
};

const operationsHeader =
	'# This file is auto generated.\n# Remove/modify this header if you want to customize the operation.\n';

const buildFieldPath = (config: GenerateConfig, field: FieldConfig) => {
	const fileName = field.rootFieldName.substring(field.namespace.length + 1) + '.graphql';
	return path.join(
		config.wgDirAbs,
		'operations',
		config.basePath,
		field.namespace,
		fileName[0].toUpperCase() + fileName.substring(1)
	);
};
