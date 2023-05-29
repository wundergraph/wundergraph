import { JSONSchema7 as JSONSchema } from 'json-schema';

export type VisitorCallBack = (name: string, isRequired: boolean, isArray: boolean) => void;
export type CustomTypeVisitorCallBack = (
	propertyName: string,
	typeName: string,
	isRequired: boolean,
	isArray: boolean
) => void;
export type StringVisitorCallBack = (
	name: string,
	isRequired: boolean,
	isArray: boolean,
	enumValues?: string[],
	enumName?: string
) => void;

export interface VisitorCallBacks {
	enter?: VisitorCallBack;
	leave?: VisitorCallBack;
}

export interface SchemaVisitor {
	root?: {
		enter?: () => void;
		leave?: () => void;
	};
	number?: VisitorCallBack;
	boolean?: VisitorCallBack;
	object?: VisitorCallBacks;
	string?: StringVisitorCallBack;
	array?: VisitorCallBacks;
	any?: VisitorCallBack;
	customType?: CustomTypeVisitorCallBack;
}

export const visitJSONSchema = (schema: JSONSchema, visitor: SchemaVisitor) => {
	visitor.root && visitor.root.enter && visitor.root.enter();
	visitProperties(schema, visitor);
	visitor.root && visitor.root.leave && visitor.root.leave();
};

const visitProperties = (schema: JSONSchema, visitor: SchemaVisitor) => {
	if (!schema.properties) {
		return;
	}
	Object.keys(schema.properties).forEach((key) => {
		const isRequired = (schema.required && schema.required.find((req) => req === key) !== undefined) || false;
		const propertySchema = schema.properties![key] as JSONSchema;
		visitSchema(propertySchema, visitor, key, isRequired, false);
	});
};

const visitSchema = (
	schema: JSONSchema,
	visitor: SchemaVisitor,
	propertyName: string,
	isRequired: boolean,
	isArray: boolean
) => {
	if (schema.$ref !== undefined) {
		const definitionName = schema.$ref.substring(schema.$ref.lastIndexOf('/') + 1);
		visitor.customType && visitor.customType(propertyName, definitionName, isRequired, isArray);
		return;
	}
	let schemaType: string | undefined;
	if (schema.type !== undefined && Array.isArray(schema.type)) {
		schemaType = schema.type.find((type) => type !== 'null') || '';
	} else {
		schemaType = schema.type || '';
	}
	switch (schemaType) {
		case 'number':
			visitor.number && visitor.number(propertyName, isRequired, isArray);
			break;
		case 'boolean':
			visitor.boolean && visitor.boolean(propertyName, isRequired, isArray);
			break;
		case 'object':
			visitor.object && visitor.object.enter && visitor.object.enter(propertyName, isRequired, isArray);
			visitProperties(schema, visitor);
			visitor.object && visitor.object.leave && visitor.object.leave(propertyName, isRequired, isArray);
			break;
		case 'string':
			visitor.string &&
				visitor.string(propertyName, isRequired, isArray, schema.enum as string[], schema['x-graphql-enum-name']);
			break;
		case 'array':
			visitor.array && visitor.array.enter && visitor.array.enter(propertyName, isRequired, isArray);
			visitSchema(schema.items as JSONSchema, visitor, '', isRequired, true);
			visitor.array && visitor.array.leave && visitor.array.leave(propertyName, isRequired, isArray);
			break;
		case 'integer':
			visitor.number && visitor.number(propertyName, isRequired, isArray);
			break;
		default:
			visitor.any && visitor.any(propertyName, isRequired, isArray);
	}
};
