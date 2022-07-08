#!/usr/bin/env node

import { cli } from './../cli';

cli().catch((err) => {
	console.error(err);
	process.exit(1);
});
