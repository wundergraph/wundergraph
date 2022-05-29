import { exec } from '@wundergraph/wunderctl';

exec().catch((err) => {
	console.error(err);
	process.exit(1);
});
