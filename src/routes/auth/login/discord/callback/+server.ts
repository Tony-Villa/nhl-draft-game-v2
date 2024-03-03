import { OAuth2RequestError } from 'arctic';
import { generateId } from 'lucia';
import { discord, lucia } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { keys } from '$lib/server/db/schema/keys';
import { users } from '$lib/server/db/schema';
import { createAndSetSession } from '$lib/server/authUtils';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('discord_oauth_state') ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		console.log('hello from discord callback')
		const tokens = await discord.validateAuthorizationCode(code);
		const discordUserResponse = await fetch('"https://discord.com/api/users/@me"', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const discordUser: DiscordUser = await discordUserResponse.json();

		const [existingUser] = await db.select().from(users).where(eq(users.email, discordUser.email))

		if (existingUser) {
			const [existingKey] = await db
			.select()
			.from(keys)
			.where(
				and(
					eq(keys.providerId, 'discord'), 
					eq(keys.providerUserId, discordUser.id.toString())
					)
				);

				console.log('existingKey: ', existingKey);

			if(!existingKey) {
				const authKeys = existingUser.keys || [];
				authKeys.push('discord');

				await db.transaction(async (trx) => {
					// link discord oauth account to the existing user
					await trx.insert(keys).values({
						providerId: 'discord',
						providerUserId: discordUser.id.toString(),
						userId: existingUser.id
					});

					// Update the user's keys list
					await trx.update(users).set({
						keys: authKeys,
						thisdoesntexits: 'yayaya'
					}).where(eq(users.id, existingUser.id));
				});
			}

			await createAndSetSession(lucia, existingUser.id, event.cookies);

		} else {
			const userId = generateId(15);

			console.log('no key found, creating new user: ', discordUser);

			await db.transaction(async (trx) => {
				await trx.insert(users).values({
					id: userId,
					email: discordUser.email,
					avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
					name: discordUser.login,
					keys: ['discord']
				});

				await trx.insert(keys).values({
					providerId: 'discord',
					providerUserId: discordUser.id.toString(),
					userId
				});
			});

			await createAndSetSession(lucia, userId, event.cookies);
		}

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/draft-center'
				}
			}
		);
		
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}


interface DiscordUser {
	id: number;
	login: string;
	email: string;
	avatar: string;
}
