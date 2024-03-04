import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';

import { message,  superValidate } from 'sveltekit-superforms/server';

import { lucia } from '$lib/server/auth';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';

import { createAndSetSession } from '$lib/server/authUtils';
import { checkIfEmailExists, insertNewUser } from '$lib/server/dbAuthUtils';
import { logError } from '$lib/utils';
import { RegisterUserZodSchema } from '$lib/validations/AuthZodSchemas';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema';
import { db } from '$lib/server/db';

export const load = (async () => {
	return {
		registerUserFormData: await superValidate(zod(RegisterUserZodSchema))
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	registerUser: async ({ request, cookies }) => {
		const registerUserFormData = await superValidate(request, zod(RegisterUserZodSchema));

		if (registerUserFormData.valid === false) {
			return message(registerUserFormData, {
				alertType: 'error',
				alertText: 'Please check your entries, the form contains invalid data'
			});
		}

		try {
			const userEmail = registerUserFormData.data.email;
			const existingUser = await checkIfEmailExists(userEmail);

			if(existingUser && existingUser.keys.includes('email')){
				return message(registerUserFormData, {
					alertType: 'error',
					alertText: 'Email already registered'
				})
			}

			const userId = existingUser?.id ?? generateId(15);
			const hashedPassword = await new Argon2id().hash(registerUserFormData.data.password);

			if(!existingUser){
				await insertNewUser({
					id: userId,
					name: registerUserFormData.data.name,
					email: registerUserFormData.data.email,
					password: hashedPassword,
					keys: ['email']
				});
			} else {
				const authKeys = existingUser.keys || [];
				authKeys.push('email');

				await db.update(users).set({
					password: hashedPassword,
					keys: authKeys,
				}).where(eq(users.email, userEmail));
			}

			await createAndSetSession(lucia, userId, cookies);
		} catch (error) {
			logError(error);

			return message(registerUserFormData, {
				alertType: 'error',
				alertText: 'An error occurred while processing your request. Please try again.'
			});
		}

		throw redirect(303, '/draft-center');
	}
};
