import { SchemaComposer } from 'graphql-compose';
import { GraphQLBigInt, GraphQLByte, GraphQLJSON, GraphQLUnsignedInt, GraphQLVoid } from 'graphql-scalars';
import protobufjs, { Message, Root } from 'protobufjs';
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor';
import { GraphQLSchema, specifiedDirectives } from 'graphql';
import DescriptorVisitor from './visitor';

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

export default class GrpcSchemaBuilder {
	private readonly protoSet: Buffer;
	private schemaComposer = new SchemaComposer();

	constructor(protoSet: Buffer) {
		this.protoSet = protoSet;
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
		this.schemaComposer.add(GraphQLBigInt);
		this.schemaComposer.add(GraphQLByte);
		this.schemaComposer.add(GraphQLUnsignedInt);
		this.schemaComposer.add(GraphQLVoid);
		this.schemaComposer.add(GraphQLJSON);
		this.schemaComposer.createScalarTC({
			name: 'File',
		});

		const namespaces = await this.getDescriptorsSet();

		for (const { name, rootNamespace } of namespaces) {
			const visitor = new DescriptorVisitor(this.schemaComposer, rootNamespace);
			visitor.visit({ nested: rootNamespace, name: '', currentPath: [] });
		}

		// graphql-compose doesn't add @defer and @stream to the schema
		specifiedDirectives.forEach((directive) => this.schemaComposer.addDirective(directive));

		return this.schemaComposer.buildSchema();
	}
}
