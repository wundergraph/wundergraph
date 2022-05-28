import run from './../exec';

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
