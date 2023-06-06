import path from 'path';

import execa from 'execa';
import { expect, describe, it } from 'vitest';

describe('Test polling', () => {
	it('should not exit if there are any APIs with polling', async () => {
		const wgDir = path.join('apps', 'basic', '.wundergraph');
		const proc = execa('node', ['generated/bundle/config.cjs'], {
			env: {
				WUNDERGRAPH_CACHE_DIR: path.join(wgDir, 'tempcache'),
				WG_DATA_SOURCE_POLLING_MODE: 'true',
				WG_DIR_ABS: wgDir,
			},
			cwd: wgDir,
			stdio: 'inherit',
		});
		// Wait 3 seconds and see if the process exited
		await new Promise((r) => setTimeout(r, 3000));
		expect(proc.exitCode).toBeNull();
		proc.kill();
	});
});
