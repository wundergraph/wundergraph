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
	const mapOfItems = new Map<string, any[]>();
	const operationsGroup = new Collection();
	operationsGroup.id = 'operations';
	operationsGroup.name = 'operations';

	operations.forEach((op) => {
		const operationURL = `{{apiBaseUrl}}/operations/${op.PathName}`;
		const folders = op.PathName.split('/');
		const opName = folders.pop();
		if (opName && folders.length > 0) {
			const item = buildItem(op, operationURL, opName);
			const key = folders.join('/');
			const keySet = mapOfItems.get(key);
			if (keySet) {
				keySet.push(item);
			} else {
				mapOfItems.set(key, [item]);
			}
		} else if (opName) {
			operationsGroup.items.add(buildItem(op, operationURL, opName));
		}
	});

	// Bit of a mind bender here, but we need to iterate over the keys to flatten the folders and only keep the last folder
	const keys = mapOfItems.keys();
	for (const key of keys) {
		const keySet = new Set();
		key.split('/').forEach((i) => keySet.add(i));
		const uniqueArray = Array.from(keySet);

		for (let i = 0; i < uniqueArray.length; i++) {
			const fullKey = uniqueArray.join('/');
			const lastFolder = uniqueArray.pop();
			const remainderKey = uniqueArray.join('/');

			const itemFolder = {
				name: lastFolder,
				id: fullKey,
				item: mapOfItems.get(fullKey),
			};

			mapOfItems.get(remainderKey)?.push(itemFolder);
			if (uniqueArray.length > 0) {
				mapOfItems.delete(fullKey);
			}
		}
	}

	for (const [key, value] of mapOfItems.entries()) {
		operationsGroup.items.add({ id: key, name: key, item: value });
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
	myCollection.items.add(operationsGroup.toJSON());

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
