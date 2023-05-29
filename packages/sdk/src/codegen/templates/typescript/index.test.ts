import { RunTemplateTest } from '../../index.test';
import {
	TypeScriptInputModels,
	TypeScriptResponseDataModels,
	TypeScriptResponseModels,
	TypeScriptEnumModels,
} from './index';
import {} from 'json-schema';

test('TypeScriptInputModels', async () => {
	const out = await RunTemplateTest(new TypeScriptEnumModels(), new TypeScriptInputModels());
	expect(out).toMatchSnapshot();
});

test('TypeScriptResponseModels', async () => {
	const out = await RunTemplateTest(
		new TypeScriptEnumModels(),
		new TypeScriptResponseModels(),
		new TypeScriptResponseDataModels()
	);
	expect(out).toMatchSnapshot();
});
