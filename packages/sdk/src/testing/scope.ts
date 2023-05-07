interface ScopeOptions {
	counter?: number;
	persist?: boolean;
}

export class Scope {
	/**
	 * The error thrown by the matcher or handler.
	 */
	public error?: Error;

	/**
	 * Counter stores the pending times that the current mock should be active.
	 */
	public counter: number;

	/**
	 *  Persisted stores if the current mock should be always active.
	 */
	private readonly persisted: boolean = false;

	/**
	 * Pending stores the number of pending calls.
	 */
	public pending: number = 0;

	constructor(options?: ScopeOptions) {
		this.counter = options?.counter ?? 1;
		this.persisted = options?.persist ?? false;
	}

	/**
	 * Is true, if the scope is persisted.
	 */
	get isPersisted() {
		return this.persisted;
	}

	/**
	 * Is true, no outstanding calls are left.
	 */
	get isDone() {
		if (this.persisted) {
			return this.pending === 0;
		}
		return this.counter === 0;
	}

	/**
	 * Throw an error if the scope is not done or an error was thrown.
	 */
	done(): void {
		if (this.error) {
			throw this.error;
		}
		if (!this.isDone) {
			if (this.persisted) {
				throw new Error(`Mock is not done. Processing ${this.pending > 1 ? 'calls' : 'call'}: ${this.pending}`);
			}
			throw new Error(`Mock is not done. Expect ${this.counter} more ${this.counter > 1 ? 'calls' : 'call'}.`);
		}
	}
}
