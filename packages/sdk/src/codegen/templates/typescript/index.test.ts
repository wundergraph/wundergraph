import { RunTemplateTest } from '../../index.test';
import {
	TypeScriptEnumModels,
	TypeScriptInputModels,
	TypeScriptResponseDataModels,
	TypeScriptResponseModels,
} from './index';

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
