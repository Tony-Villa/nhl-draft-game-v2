import type { SubmitFunction } from '@sveltejs/kit';

export class PendingForm {
	current = $state<string | null>(null);

	is(key: string) {
		return this.current === key;
	}

	enhance(key: string): SubmitFunction {
		return ({ cancel }) => {
			if (this.current !== null) {
				cancel();
				return;
			}

			this.current = key;

			return async ({ update }) => {
				try {
					await update();
				} finally {
					if (this.current === key) {
						this.current = null;
					}
				}
			};
		};
	}
}
