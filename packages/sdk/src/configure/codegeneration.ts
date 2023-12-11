import { buildSchema, parse, visit } from 'graphql';
import { CodeGen, ResolvedWunderGraphConfig, WunderGraphConfigApplicationConfig } from './index';
import { Api } from '../definition';

export interface GenerateConfig {
	operationsGenerator?: OperationsGeneration;
	codeGenerators?: CodeGen[];
}

export type OperationsGeneration = (config: OperationsGenerationConfig) => void;

export type OperationsGenerationNamespaceOptions = {
	depthLimit?: number;
	circularReferenceDepth?: number;
	argNames?: string[];
	ignore?: string[];
};

export class OperationsGenerationConfig {
	private rootFields: FieldConfig[] = [];
	private basePath: string = '';
	private namespaces: string[];
	private pristine: boolean = true;
	private options: Record<string, OperationsGenerationNamespaceOptions> = {};

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
		let currentOperationType: 'query' | 'mutation' | 'subscription' | undefined = 'query';
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
						currentOperationType = undefined;
						return false;
				}
			},
			FieldDefinition: (node) => {
				const namespaceIndex = node.name.value.indexOf('_');

				if (!currentOperationType) {
					// ignore fields that are not part of a root type
					return;
				}

				this.rootFields.push({
					operationType: currentOperationType,
					name: node.name.value,
					apiNamespace: namespaceIndex === -1 ? '' : node.name.value.substring(0, namespaceIndex),
				});
			},
		});
	}

	public includeNamespaces(...namespaces: string[]) {
		namespaces = namespaces.filter((namespace) => this.namespaces.includes(namespace));
		this.rootFields = this.rootFields.filter((field) => namespaces.includes(field.apiNamespace));
		this.pristine = false;
	}

	public excludeNamespaces(...namespaces: string[]) {
		namespaces = namespaces.filter((namespace) => this.namespaces.includes(namespace));
		this.rootFields = this.rootFields.filter((field) => !namespaces.includes(field.apiNamespace));
		this.pristine = false;
	}

	public filterRootFields(filter: (field: FieldConfig) => boolean) {
		this.rootFields = this.rootFields.filter(filter);
		this.pristine = false;
	}

	public excludeQueryFields() {
		this.rootFields = this.rootFields.filter((field) => field.operationType !== 'query');
		this.pristine = false;
	}

	public excludeMutationFields() {
		this.rootFields = this.rootFields.filter((field) => field.operationType !== 'mutation');
		this.pristine = false;
	}

	public excludeSubscriptionFields() {
		this.rootFields = this.rootFields.filter((field) => field.operationType !== 'subscription');
		this.pristine = false;
	}

	public setBasePath(basePath: string) {
		this.basePath = basePath;
		this.pristine = false;
	}

	public configureOperations(map: (field: FieldConfig) => FieldConfig) {
		this.rootFields = this.rootFields.map(map);
		this.pristine = false;
	}

	public getBasePath(): string {
		return this.basePath;
	}

	public getRootFields(): FieldConfig[] {
		if (this.pristine) {
			// in case no filter was applied, return no fields as we don't want to generate any operations
			return [];
		}
		return this.rootFields;
	}

	public setOptions(namespace: string, options: OperationsGenerationNamespaceOptions) {
		this.options[namespace] = options;
	}

	public getOptions(namespace: string): OperationsGenerationNamespaceOptions {
		return this.options[namespace] || {};
	}
}

export interface FieldConfig {
	operationType: 'query' | 'mutation' | 'subscription';
	name: string;
	apiNamespace: string;
}

export const configureWunderGraphGeneration = (config: GenerateConfig): GenerateConfig => {
	return config;
};
