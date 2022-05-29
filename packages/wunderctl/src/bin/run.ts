import { exec } from './../exec';

exec().catch((err) => {
	console.error(err);
	process.exit(1);
});
