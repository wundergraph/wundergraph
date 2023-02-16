interface ImportMetaEnv extends Record<`VITE_${string}`, any>, Record<string, any> {
	BASE_URL: string;
	MODE: string;
	DEV: boolean;
	PROD: boolean;
	SSR: boolean;
}

interface ImportMeta {
	url: string;

	readonly hot?: import('vite/types/hot').ViteHotContext;

	readonly env: ImportMetaEnv;

	glob: import('vite/types/importGlob').ImportGlobFunction;
	/**
	 * @deprecated Use `import.meta.glob('*', { eager: true })` instead
	 */
	globEager: import('vite/types/importGlob').ImportGlobEagerFunction;
}
