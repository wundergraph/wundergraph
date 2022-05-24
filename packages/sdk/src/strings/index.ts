export const stringToCamelCase = (str: string) => {
	if (str.indexOf('_') === -1) {
		return str;
	}
	return str.toLowerCase().replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
};

export const stringToSnakeCase = (str: string) => {
	const out = str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	if (out.indexOf('_') === 0) {
		return out.slice(1);
	}
	return out;
};
