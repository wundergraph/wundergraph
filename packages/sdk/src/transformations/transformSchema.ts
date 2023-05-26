import { replaceCustomScalars } from './replaceCustomScalars';
import { replaceCustomNumericScalars } from './replaceCustomNumericScalars';

export type { ReplaceCustomScalarsResult } from './replaceCustomScalars';

export type { ReplaceCustomNumericScalarsResult, ArgumentReplacement } from './replaceCustomNumericScalars';

const transformSchema = {
	replaceCustomScalars,
	replaceCustomNumericScalars,
};

export default transformSchema;
