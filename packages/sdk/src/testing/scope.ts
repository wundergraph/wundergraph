export interface ScopeOptions {
	counter?: number;
	persist?: boolean;
}

export interface PublicScope {
	/**
	 * The error thrown by the matcher or handler.
	 */
	error?: Error;
	/**
	 * Is true, no outstanding calls are left.
	 */
	isDone: boolean;
	/**
	 * Throw an error if the scope is not done or an error was thrown.
	 */
	done(): void;
}

export interface ScopeState {
	/**
	 * Counter stores the pending times that the current mock should be active.
	 */
	counter: number;
	/**
	 * Matched stores if the current mock was matched at least once.
	 */
	matched: boolean;
	/**
	 * The error thrown by the matcher or handler.
	 */
	error?: Error;
	/**
	 * Pending stores the number of pending calls.
	 */
	pending: number;
}

export class Scope {
	public state: ScopeState = { counter: 1, matched: false, pending: 0 };

	constructor(public options?: ScopeOptions) {
		this.state.counter = options?.counter ?? 1;
	}

	get error() {
		return this.state.error;
	}

	get isDone() {
		if (this.options?.persist) {
			return this.state.pending === 0 && this.state.matched;
		}
		return this.state.counter === 0 && this.state.matched;
	}

	done(): void {
		if (this.state.error) {
			throw this.state.error;
		}

		if (this.state.matched === false) {
			throw new Error('No request matched.');
		}

		if (!this.isDone) {
			if (this.options?.persist) {
				throw new Error(`Mock is not done. Processing ${this.state.pending} requests.`);
			}
			throw new Error(`Mock is not done. Expect ${this.state.counter} more calls.`);
		}
	}
}
