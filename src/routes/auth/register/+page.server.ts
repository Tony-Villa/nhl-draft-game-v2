import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';

import { message,  superValidate } from 'sveltekit-superforms/server';

import { generateId } from 'better-auth';
import { Argon2id } from 'oslo/password';

import { createAndSetSession, linkAuthAccount } from '$lib/server/authUtils';
import { checkIfEmailExists } from '$lib/server/dbAuthUtils';
import { RegisterUserZodSchema } from '$lib/validations/AuthZodSchemas';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema';
import { db } from '$lib/server/db';

export const load = (async () => {
	return {
		registerUserFormData: await superValidate(zod(RegisterUserZodSchema as never))
	};
});

export const actions: Actions = {
	registerUser: async ({ request, cookies }) => {
		const registerUserFormData = await superValidate(request, zod(RegisterUserZodSchema as never));

		if (registerUserFormData.valid === false) {
			return message(registerUserFormData, {
				alertType: 'error',
				alertText: 'Please check your entries, the form contains invalid data'
			});
		}

		try {
			const { email: userEmail, name, password } = registerUserFormData.data as {
				email: string;
				name: string;
				password: string;
			};
			const existingUser = await checkIfEmailExists(userEmail);

			if(existingUser && existingUser.keys.includes('email')){
				return message(registerUserFormData, {
					alertType: 'error',
					alertText: 'Email already registered'
				})
			}

			const userId = existingUser?.id ?? generateId(15);
			const hashedPassword = await new Argon2id().hash(password);

			if(!existingUser){
				await db.transaction(async (trx) => {
					await trx.insert(users).values({
						id: userId,
						name,
						email: userEmail,
						password: hashedPassword,
						keys: ['email']
					});

					await linkAuthAccount(trx, {
						userId,
						providerId: 'credential',
						providerUserId: userId,
						password: hashedPassword
					});
				});
			} else {
				const authKeys = existingUser.keys || [];
				if (!authKeys.includes('email')) {
					authKeys.push('email');
				}

				await db.transaction(async (trx) => {
					await trx.update(users).set({
						password: hashedPassword,
						keys: authKeys,
					}).where(eq(users.email, userEmail));

					await linkAuthAccount(trx, {
						userId,
						providerId: 'credential',
						providerUserId: userId,
						password: hashedPassword
					});
				});
			}

			await createAndSetSession(userId, cookies);
		} catch (error) {
			console.error('Registration error:', error);

			return message(registerUserFormData, {
				alertType: 'error',
				alertText: 'An error occurred while processing your request. Please try again.'
			});
		}

		throw redirect(303, '/draft-center');
	}
};
