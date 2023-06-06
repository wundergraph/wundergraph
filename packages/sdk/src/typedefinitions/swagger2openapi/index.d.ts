declare module 'swagger2openapi' {
	interface ConvertResult {
		openapi: any;
	}

	interface ConvertOptions {}

	function convertObj(spec: Object, options: ConvertOptions): Promise<ConvertResult>;

	export { convertObj };
}
