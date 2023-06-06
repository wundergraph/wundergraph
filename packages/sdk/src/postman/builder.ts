import { OperationType } from '@wundergraph/protobuf';
import { JSONSchema7Definition } from 'json-schema';
import { Collection, Item, PropertyList, Request } from 'postman-collection';
import { GraphQLOperation } from '../graphql/operations';

export interface PostmanBuilderOptions {
	baseURL: string;
}

export interface JSONSchemaParameterPath {
	path: string[];
	required: boolean;
	type: string;
}

const buildItem = (op: GraphQLOperation, operationURL: string, opName: string) => {
	let paths: JSONSchemaParameterPath[] = [];
	buildPath([], false, op.VariablesSchema, paths);

	if (op.Internal) {
		return undefined;
	}

	if (op.OperationType !== OperationType.MUTATION) {
		const request = queryRequestJson(operationURL, paths);

		return {
			id: op.PathName,
			name: opName,
			request: request,
		};
	} else if (op.OperationType === OperationType.MUTATION) {
		const request = mutationRequestJson(operationURL, paths);

		return {
			id: op.Name,
			name: opName,
			request: request,
		};
	}
};

export const PostmanBuilder = (operations: GraphQLOperation[], options: PostmanBuilderOptions) => {
	const separator = '/';

	const rootCollection = new Collection();
	rootCollection.id = 'operations';
	rootCollection.name = 'operations';

	// Since there's no guarantee of the operation order, create a collection
	// per directory for now, then iterate the keys to add child/parent relationships
	const collectionsByKey: Record<string, Collection> = { '': rootCollection };

	operations.forEach((op) => {
		const operationURL = `{{apiBaseUrl}}/operations/${op.PathName}`;
		const folders = op.PathName.split(separator);
		const opName = folders.pop();
		if (!opName) {
			return;
		}
		const item = buildItem(op, operationURL, opName);
		if (!item) {
			return;
		}
		const key = folders.join(separator);
		let collection = collectionsByKey[key];
		if (collection === undefined) {
			collection = new Collection();
			collection.id = key;
			collection.name = key;
			collectionsByKey[key] = collection;
		}
		collection.items.add(item);
	});

	// Skip key === '', since that's the root object. Then sort keys by length so parents come before children
	// and we initialize the container before its items.
	const keys = Object.keys(collectionsByKey)
		.filter((key) => key !== '')
		.sort((a, b) => a.length - b.length);

	for (const key of keys) {
		const value = collectionsByKey[key];
		let parent: Collection | undefined;
		if (key.includes(separator)) {
			const components = key.split(separator);
			components.pop();
			while (components.length > 0) {
				const parentKey = components.join(separator);
				if (collectionsByKey[parentKey]) {
					parent = collectionsByKey[parentKey];
					break;
				}
				components.pop();
			}
		}
		parent = parent || rootCollection;
		parent.items.add(value);
	}

	const myCollection = new Collection();
	myCollection.id = 'Wundergraph';
	myCollection.describe('Your Wundergraph collection');
	myCollection.name = 'Wundergraph';

	// add variables
	myCollection.variables.add({
		key: 'apiBaseUrl',
		value: options.baseURL,
		type: 'string',
	});

	// add sub collections
	myCollection.items.add(rootCollection.toJSON());

	return myCollection;
};

const mutationRequestJson = (url: string, paths: JSONSchemaParameterPath[]): string => {
	const request = new Request({
		url: url,
		method: 'POST',
		body: {
			mode: 'urlencoded',
			urlencoded: [],
			description: 'Your GraphQL variables in JSON',
		},
	});

	for (const path of paths) {
		request.body?.urlencoded.add({
			key: path.path.join('.'),
			disabled: !path.required,
			description: `Type ${path.type}, ${path.required ? 'Required' : 'Optional'}`,
			value: '',
			type: 'text',
		});
	}

	return request.toJSON();
};

const queryRequestJson = (url: string, paths: JSONSchemaParameterPath[]): string => {
	const request = new Request({
		url: url,
		method: 'GET',
	});
	request.addHeader({
		key: 'Content-Type',
		value: 'application/json',
	});

	for (const path of paths) {
		request.addQueryParams([
			{
				key: path.path.join('.'),
				disabled: !path.required,
				value: '',
				description: `Type ${path.type}, ${path.required ? 'Required' : 'Optional'}`,
			},
		]);
	}

	return request.toJSON();
};

// TODO: Add "default" values
// path syntax follows https://github.com/tidwall/sjson#path-syntax
export function buildPath(
	path: string[],
	required: boolean,
	obj: JSONSchema7Definition,
	paths: JSONSchemaParameterPath[]
) {
	if (typeof obj === 'boolean') return;

	if (obj.type === 'array') {
		if (typeof obj.items === 'boolean') return;
		if (!obj.items) return;

		let items = [];
		if (!Array.isArray(obj.items)) items.push(obj.items);
		items.forEach((obj, index) => buildPath([...path, index.toString()], false, obj, paths));
		return;
	}

	// those nodes are limited due to recursion
	if (!obj.type) return;

	if (obj.properties) {
		Object.keys(obj.properties).forEach((key) => {
			if (obj.properties) {
				buildPath([...path, key], obj.required?.includes(key) || required, obj.properties[key], paths);
			}
		});
		return;
	}

	paths.push({
		path,
		required: false, // ignore it for now because this would make all variants required
		type: typeof obj.type === 'string' ? obj.type : 'any',
	});

	paths.sort(function (a, b) {
		return a.path.length - b.path.length;
	});
}
