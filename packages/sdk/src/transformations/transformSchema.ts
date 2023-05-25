import { replaceCustomScalars } from './replaceCustomScalars';
export type { ReplaceCustomScalarsResult } from './replaceCustomScalars';

import { replaceCustomNumericScalars } from './replaceCustomNumericScalars';
import { replaceScalarsWithCustomScalars } from './replaceScalarsWithCustomScalars';
export type { ReplaceCustomNumericScalarsResult, ArgumentReplacement } from './replaceCustomNumericScalars';

const transformSchema = {
	replaceCustomScalars,
	replaceCustomNumericScalars,
	replaceScalarsWithCustomScalars,
};

export default transformSchema;
