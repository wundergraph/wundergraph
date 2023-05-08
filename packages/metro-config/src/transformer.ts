/* @ts-ignore */
import transformer from 'metro-react-native-babel-transformer';

function injectPolyfills(source: string) {
	const polyfills = `
require('url-search-params-polyfill');
const { NativeEventSource, EventSourcePolyfill } = require('event-source-polyfill');
global.EventSource = NativeEventSource || EventSourcePolyfill;
`;
	return polyfills + source;
}

export async function transform(file: { filename: string; src: string; options: any }) {
	if (file.filename.match('AppEntry.js')) {
		const src = injectPolyfills(file.src);
		return transformer.transform({
			...file,
			src,
		});
	}

	return transformer.transform(file);
}
