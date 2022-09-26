import { RunTemplateTest } from '../../index.test';
import { TypeScriptInputModels, TypeScriptResponseDataModels, TypeScriptResponseModels } from './index';

test('TypeScriptInputModels', async () => {
	const out = await RunTemplateTest(new TypeScriptInputModels());
	expect(out).toMatchSnapshot();
});

test('TypeScriptResponseModels', async () => {
	const out = await RunTemplateTest(new TypeScriptResponseModels(), new TypeScriptResponseDataModels());
	expect(out).toMatchSnapshot();
});
