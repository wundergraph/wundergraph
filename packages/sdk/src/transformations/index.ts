import { Api, RenameType, RenameTypeField } from '../definition';

const renameTypes = async <T extends {} = {}>(api: Promise<Api<T>>, ...rename: RenameType[]): Promise<Api<T>> => {
	const resolved = await api;
	resolved.renameTypes(rename);
	return resolved;
};

const renameFields = async <T extends {} = {}>(api: Promise<Api<T>>, ...rename: RenameTypeField[]): Promise<Api<T>> => {
	const resolved = await api;
	resolved.renameTypeFields(rename);
	return resolved;
};

const transformApi = {
	renameTypes,
	renameFields,
};

export default transformApi;
