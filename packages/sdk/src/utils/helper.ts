export const noop = () => {};

export const UNDEFINED = /*#__NOINLINE__*/ noop() as undefined;

export const isFunction = <T extends (...args: any[]) => any = (...args: any[]) => any>(v: unknown): v is T =>
	typeof v == 'function';

export const isUndefined = (v: any): v is undefined => v === UNDEFINED;

export const OBJECT = Object;
