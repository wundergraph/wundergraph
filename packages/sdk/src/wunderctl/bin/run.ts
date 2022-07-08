#!/usr/bin/env node

import { cli } from '@wundergraph/wunderctl';

cli().catch((err: any) => {
	console.error(err);
	process.exit(1);
});
