import { lucia } from "$lib/server/auth";
import { deleteSessionCookie } from "$lib/server/authUtils";
import { redirect, type Actions } from "@sveltejs/kit";
import type { RequestEvent } from "../$types";

export const actions: Actions = {
	logout: async ({ cookies, locals }: RequestEvent) => {
		if (!locals.session?.id) return;

		await lucia.invalidateSession(locals.session.id);

		await deleteSessionCookie(lucia, cookies);

		throw redirect(303, '/draft-center');
	},
};