import { GraphQLSchema, printSchema } from 'graphql';

// link building definition

export type LinkConfiguration = LinkDefinition[];

export interface LinkDefinition {
	targetType: string;
	targetFieldName: string;
	sourceField: string;
	argumentSources: LinkFieldArgumentSourceDefinition[];
}

export interface LinkFieldArgumentSourceDefinition {
	name: string;
	type: 'objectField' | 'fieldArgument';
	path: string[];
}

// query type field info

export interface FieldInfo {
	typeName: string;
	fieldName: string;
	fieldType: string;
	arguments: ArgumentInfo[];
}

export interface ArgumentInfo {
	name: string;
	type: string;
}

export const queryTypeFields = (schema: GraphQLSchema): FieldInfo[] => {
	const info: FieldInfo[] = [];
	const queryType = schema.getQueryType();
	if (!queryType) {
		return info;
	}
	const fields = queryType.getFields();
	if (!fields) {
		return info;
	}
	Object.keys(fields).forEach((key) => {
		const field = fields[key];
		const name = field.name;
		info.push({
			typeName: queryType.name,
			fieldName: name,
			fieldType: field.type.toString(),
			arguments: field.args.map((arg) => ({
				name: arg.name,
				type: arg.type.toString(),
			})),
		});
	});
	return info;
};

export interface TypeInfo {
	typeName: string;
	fieldNames: string[];
}

export const typesInfo = (schema: GraphQLSchema): TypeInfo[] => {
	const typeNames: TypeInfo[] = [];
	const types = schema.getTypeMap();
	const queryTypeName = (schema.getQueryType() || { name: '' }).name;
	const mutationTypeName = (schema.getMutationType() || { name: '' }).name;
	const subscriptionTypeName = (schema.getSubscriptionType() || { name: '' }).name;
	Object.keys(types).forEach((key) => {
		const type = types[key];
		if (
			type.astNode &&
			(type.astNode.kind === 'InterfaceTypeDefinition' || type.astNode.kind === 'ObjectTypeDefinition')
		) {
			if (type.name !== queryTypeName && type.name !== mutationTypeName && type.name !== subscriptionTypeName) {
				typeNames.push({
					typeName: type.name,
					fieldNames: (type.astNode.fields || []).map((value) => value.name.value),
				});
			}
		}
	});
	return typeNames.filter((t) => t.fieldNames.length !== 0);
};

// manually built link builder, re-used in code generator

class LinkBuilder<T, R extends {} = {}, TT = {}> {
	// @ts-ignore
	constructor(current: R = {}, sourceField: string, targetType: string, targetField: string) {
		this.current = current;
		this.sourceField = sourceField;
		this.targetType = targetType;
		this.targetField = targetField;
	}

	private readonly sourceField: string;
	private readonly targetType: string;
	private readonly targetField: string;

	// @ts-ignore
	private current: R = {};

	argument<P extends Exclude<keyof T, keyof R>, V extends T[P], S extends 'fieldArgument' | 'objectField'>(
		key: P,
		source: S,
		value: S extends 'fieldArgument' ? string : TT,
		...extraPath: string[]
	) {
		const extra: {} = { [key]: { source, path: [value, ...extraPath] } };

		const instance = {
			...(this.current as object),
			...extra,
		} as R & Pick<T, P>;

		return new LinkBuilder<T, R & Pick<T, P>, TT>(instance, this.sourceField, this.targetType, this.targetField);
	}

	build = (): LinkDefinition => {
		const args = this.current as { [key: string]: { path: string[]; source: 'fieldArgument' | 'objectField' } };
		return {
			argumentSources: Object.keys(args).map((key) => ({
				name: key,
				type: args[key].source,
				path: args[key].path,
			})),
			targetType: this.targetType,
			sourceField: this.sourceField,
			targetFieldName: this.targetField,
		};
	};
}

export const sourceFieldStep = <T extends {}, R extends {}>() => ({
	source: <F extends keyof T>(field: F) => {
		return targetTypeStep<T, F, R>(field);
	},
});

const targetTypeStep = <T, F extends keyof T, R>(field: F) => ({
	target: <r extends keyof R>(targetType: r, targetField: string) => {
		return new LinkBuilder<T[F], {}, R[r]>({}, field as string, targetType as string, targetField);
	},
});
