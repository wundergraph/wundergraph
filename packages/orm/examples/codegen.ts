import { readFileSync, writeFileSync } from 'fs';

import { codegen } from '../src';

const schema = readFileSync(process.argv[2], 'utf-8');
const output = codegen(schema);

process.stdout.write(output);
