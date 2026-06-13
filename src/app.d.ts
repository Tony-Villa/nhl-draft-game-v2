// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user:
				| (import('better-auth').User & {
						avatarUrl?: string | null;
						keys?: string[];
				  })
				| null;
			session: import('better-auth').Session | null;
		}

		// interface Error {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
