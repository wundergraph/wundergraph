// See https://kit.svelte.dev/docs/types#app

import type { PublicUser } from "$lib/generated/client";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		 interface Locals {
			user: PublicUser | null
		 }
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
