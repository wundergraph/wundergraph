import { stableHash } from './hash';
import { isFunction } from './helper';

type ArgumentsTuple = [any, ...unknown[]] | readonly [any, ...unknown[]];
export type Arguments = string | ArgumentsTuple | Record<any, any> | null | undefined | false;
export type Key = Arguments | (() => Arguments);

/***
 * Serialize data to a string
 * It uses a stable hash function to serialize data
 * The implementation uses globals. This is not a serialization function,
 * and the result is not guaranteed to be parsable.
 */
export const serialize = (key: Key) => _serialize(key)[0];

const _serialize = (key: Key): [string, Key] => {
	if (isFunction(key)) {
		try {
			key = key();
		} catch (err) {
			// dependencies not ready
			key = '';
		}
	}

	// Use the original key as the argument of fetcher. This can be a string or an
	// array of values.
	const args = key;

	// If key is not falsy, or not an empty array, hash it.
	key = typeof key == 'string' ? key : (Array.isArray(key) ? key.length : key) ? stableHash(key) : '';

	return [key, args];
};
