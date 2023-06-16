export const noop = () => {};

export const UNDEFINED = /*#__NOINLINE__*/ noop() as undefined;

export const isFunction = <T extends (...args: any[]) => any = (...args: any[]) => any>(v: unknown): v is T =>
	typeof v == 'function';

export const isUndefined = (v: any): v is undefined => v === UNDEFINED;

export const OBJECT = Object;

/**
 * Produces a deep copy of the given argument, used structuredClone() if available
 * @param v Value to copy
 * @returns Deep copy of v
 */
export const deepClone = <T>(v: T): T => {
	if (typeof structuredClone === 'function') {
		return structuredClone(v);
	}
	return JSON.parse(JSON.stringify(v));
};
