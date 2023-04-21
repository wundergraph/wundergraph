import { buildSchema, parse, visit } from 'graphql';
import { CodeGen, ResolvedWunderGraphConfig, WunderGraphConfigApplicationConfig } from './index';
import { Api } from '../definition';

export interface GenerateConfig {
	operationsGeneration?: OperationsGeneration;
	codeGenerators?: CodeGen[];
}

export type OperationsGeneration = (config: OperationsGenerationConfig) => void;

export class OperationsGenerationConfig {
	public rootFields: FieldConfig[] = [];
	public basePath: string = '';
	private namespaces: string[];

	constructor(config: {
		app: WunderGraphConfigApplicationConfig<any, any>;
		apis: Awaited<Api<any>>[];
		resolved: ResolvedWunderGraphConfig;
	}) {
		this.namespaces = config.apis.map((a) => a.Namespace).filter((value, index, self) => self.indexOf(value) === index);
		const schema = buildSchema(config.resolved.application.EngineConfiguration.Schema);
		const doc = parse(config.resolved.application.EngineConfiguration.Schema);
		const queryTypeName = schema.getQueryType()?.name || '';
		const mutationTypeName = schema.getMutationType()?.name || '';
		const subscriptionTypeName = schema.getSubscriptionType()?.name || '';
		let currentOperationType: 'query' | 'mutation' | 'subscription' = 'query';
		visit(doc, {
			ObjectTypeDefinition: (node) => {
				switch (node.name.value) {
					case queryTypeName:
						currentOperationType = 'query';
						return;
					case mutationTypeName:
						currentOperationType = 'mutation';
						return;
					case subscriptionTypeName:
						currentOperationType = 'subscription';
						return;
					default:
						// don't visit other types
						return false;
				}
			},
			FieldDefinition: (node) => {
				const namespaceIndex = node.name.value.indexOf('_');
				this.rootFields.push({
					operationType: currentOperationType,
					rootFieldName: node.name.value,
					namespace: namespaceIndex === -1 ? '' : node.name.value.substring(0, namespaceIndex),
				});
			},
		});
	}

	public includeNamespaces(...namespaces: string[]) {
		namespaces = namespaces.filter((namespace) => this.namespaces.includes(namespace));
		this.rootFields = this.rootFields.filter((field) => namespaces.includes(field.namespace));
	}

	public excludeNamespaces(...namespaces: string[]) {
		namespaces = namespaces.filter((namespace) => this.namespaces.includes(namespace));
		this.rootFields = this.rootFields.filter((field) => !namespaces.includes(field.namespace));
	}

	public filterRootFields(filter: (field: FieldConfig) => boolean) {
		this.rootFields = this.rootFields.filter(filter);
	}

	public excludeQueryFields() {
		this.rootFields = this.rootFields.filter((field) => field.operationType !== 'query');
	}

	public excludeMutationFields() {
		this.rootFields = this.rootFields.filter((field) => field.operationType !== 'mutation');
	}

	public excludeSubscriptionFields() {
		this.rootFields = this.rootFields.filter((field) => field.operationType !== 'subscription');
	}

	public setBasePath(basePath: string) {
		this.basePath = basePath;
	}

	public configureOperations(map: (field: FieldConfig) => FieldConfig) {
		this.rootFields = this.rootFields.map(map);
	}
}

export interface FieldConfig {
	operationType: 'query' | 'mutation' | 'subscription';
	rootFieldName: string;
	namespace: string;
}

export const configureWunderGraphGeneration = (config: GenerateConfig): GenerateConfig => {
	return config;
};
