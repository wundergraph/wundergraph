import { SchemaComposer } from 'graphql-compose';
import { GraphQLBigInt, GraphQLByte, GraphQLJSON, GraphQLUnsignedInt, GraphQLVoid } from 'graphql-scalars';
import protobufjs, { Message, Root } from 'protobufjs';
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor';
import { GraphQLSchema, specifiedDirectives } from 'graphql';
import DescriptorVisitor, { MethodInfo } from './visitor';
import { DataSource, GrpcApiCustom } from '../definition';
import { ConfigurationVariable, DataSourceKind, FieldConfiguration } from '@wundergraph/protobuf';
import { InputVariable, mapInputVariable } from '../configure';

type DecodedDescriptorSet = Message<IFileDescriptorSet> & IFileDescriptorSet;

export declare type Options = protobufjs.IParseOptions &
	protobufjs.IConversionOptions & {
		includeDirs?: string[];
	};

interface RootConstructor {
	new (options?: Options): Root;

	fromDescriptor(descriptorSet: IFileDescriptorSet | protobufjs.Reader | Uint8Array): Root;

	fromJSON(json: protobufjs.INamespace, root?: Root): Root;
}

function createSchemaComposer(enableSubscription: boolean): SchemaComposer {
	const schemaComposer = new SchemaComposer();
	schemaComposer.add(GraphQLBigInt);
	schemaComposer.add(GraphQLByte);
	schemaComposer.add(GraphQLUnsignedInt);
	schemaComposer.add(GraphQLVoid);
	schemaComposer.add(GraphQLJSON);

	if (enableSubscription) {
		schemaComposer.createScalarTC({
			name: 'File',
		});
	}

	return schemaComposer;
}

export default class GrpcSchemaBuilder {
	private readonly protoSet: Buffer;
	private readonly protoSetString: string;
	private readonly target: ConfigurationVariable;
	private readonly schemaComposer: SchemaComposer;
	private readonly enableSubcriptions: boolean;
	private methods: MethodInfo[] = [];

	constructor(protoSet: Buffer, url: InputVariable) {
		this.enableSubcriptions = false;
		this.protoSet = protoSet;
		this.protoSetString = protoSet.toString('base64');
		this.target = mapInputVariable(url);
		this.schemaComposer = createSchemaComposer(this.enableSubcriptions);
	}

	async getRootPromiseFromDescriptorProtoSet(): Promise<protobufjs.Root> {
		const decodedDescriptorSet = FileDescriptorSet.decode(this.protoSet) as DecodedDescriptorSet;

		return (Root as RootConstructor).fromDescriptor(decodedDescriptorSet);
	}

	async getDescriptorsSet() {
		const rootPromises: Promise<protobufjs.Root>[] = [];
		const rootPromise = this.getRootPromiseFromDescriptorProtoSet();
		rootPromises.push(rootPromise);

		return Promise.all(
			rootPromises.map(async (root$, i) => {
				const root = await root$;
				const rootName = root.name || `Root${i}`;
				root.resolveAll();
				return {
					name: rootName,
					rootNamespace: root.toJSON({
						keepComments: true,
					}),
				};
			})
		);
	}

	async Schema(): Promise<GraphQLSchema> {
		const namespaces = await this.getDescriptorsSet();

		for (const { name, rootNamespace } of namespaces) {
			const visitor = new DescriptorVisitor(this.schemaComposer, rootNamespace, this.enableSubcriptions);
			visitor.Visit({ nested: rootNamespace, name: '', currentPath: [] });
			this.methods.push(...visitor.Methods());
		}

		if (this.enableSubcriptions) {
			// graphql-compose doesn't add @defer and @stream to the schema
			specifiedDirectives.forEach((directive) => this.schemaComposer.addDirective(directive));
		}

		return this.schemaComposer.buildSchema();
	}

	BuildDatasources(): { dataSources: DataSource<GrpcApiCustom>[]; fields: FieldConfiguration[] } {
		const dataSources: DataSource<GrpcApiCustom>[] = [];
		const fields: FieldConfiguration[] = [];
		for (const method of this.methods) {
			dataSources.push(this.buildDataSource(method));
			fields.push(this.buildFieldConfiguration(method));
		}
		return { dataSources, fields };
	}

	buildDataSource(methodInfo: MethodInfo): DataSource<GrpcApiCustom> {
		return {
			Kind: DataSourceKind.GRPC,
			RootNodes: [
				{
					typeName: this.enableSubcriptions ? 'Subscription' : 'Query',
					fieldNames: [methodInfo.fieldName],
				},
			],
			ChildNodes: [],
			Custom: {
				server: {
					protoset: this.protoSetString,
					target: this.target,
				},
				endpoint: {
					package: methodInfo.package,
					service: methodInfo.service,
					method: methodInfo.method,
				},
				request: {
					header: {},
					body: '{{ .arguments.input }}',
				},
			},
			Directives: [],
		};
	}

	buildFieldConfiguration(methodInfo: MethodInfo): FieldConfiguration {
		return {
			typeName: this.enableSubcriptions ? 'Subscription' : 'Query',
			fieldName: methodInfo.fieldName,
			disableDefaultFieldMapping: true,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		};
	}
}
