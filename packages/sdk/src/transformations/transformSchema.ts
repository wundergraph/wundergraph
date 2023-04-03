import { replaceCustomScalars } from './replaceCustomScalars';
export type { ReplaceCustomScalarsResult } from './replaceCustomScalars';

import { replaceCustomNumericScalars } from './replaceCustomNumericScalars';
export type { ReplaceCustomNumericScalarsResult, ArgumentReplacement } from './replaceCustomNumericScalars';

const transformSchema = {
	replaceCustomScalars,
	replaceCustomNumericScalars,
};

export default transformSchema;
