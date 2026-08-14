declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			safeGetSession: () => Promise<{ session: any | null; user: any | null }>;
			session: any | null;
			user: any | null;
		}
		interface PageData {
			session: any | null;
			user: any | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
