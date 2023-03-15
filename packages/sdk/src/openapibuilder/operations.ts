import { JSONSchema7Definition, JSONSchema7TypeName } from 'json-schema';

export interface JSONSchemaParameterPath {
	path: string[];
	required: boolean;
	type: JSONSchema7TypeName;
}

// TODO: Add "default" values
// path syntax follows https://github.com/tidwall/sjson#path-syntax
export function buildPath(
	path: string[],
	required: boolean,
	obj: JSONSchema7Definition,
	paths: JSONSchemaParameterPath[]
) {
	if (typeof obj === 'boolean' || typeof obj === 'undefined') return;

	// those nodes are limited due to recursion
	if (!obj.type) return;

	if (obj.type === 'array') {
		if (typeof obj.items === 'boolean') return;
		if (!obj.items) return;

		let items = [];
		if (!Array.isArray(obj.items)) items.push(obj.items);
		items.forEach((obj, index) => buildPath([...path, index.toString()], false, obj, paths));
		return;
	}

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
		required,
		type: obj.type as JSONSchema7TypeName,
	});

	paths.sort(function (a, b) {
		return a.path.length - b.path.length;
	});
}
