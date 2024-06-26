import { json } from '@sveltejs/kit';
import { drafts } from '$lib/server/db/schema/drafts';
import type { DraftBoard } from '$lib/types.js';
import { createClient } from '@libsql/client';
import { VITE_TURSO_DB_AUTH_TOKEN, VITE_TURSO_DB_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/libsql';



export async function POST({ request }) {
  const { data } = await request.json();

  const {draftboard, user} = data;

	const client = createClient({
		url: VITE_TURSO_DB_URL,
		authToken: VITE_TURSO_DB_AUTH_TOKEN
	});
	const db = drizzle(client);

  Promise.all(draftboard.map(async (draft: DraftBoard) => {
    if (!draft.prospect) return;
    if (!draft.teamName) return;

    await db
    .insert(drafts)
    .values({
            userId: user.id,
            positionDrafted: draft.draftPosition,
            team: draft.teamName,
            prospect: JSON.stringify(draft.prospect),
            gameId: 1
        })
    .onConflictDoUpdate({
        target: [drafts.positionDrafted, drafts.userId],
        set: { prospect: JSON.stringify(draft.prospect) },
    });
  })).catch(async err => {
		console.error(err)

		const response = await fetch('https://debug.fly.dev/')
		const tursoDebug = await response.text()

		console.log(tursoDebug);
		return json({message: 'failed'})
	});


  return json({ message: 'success' }, { status: 201 });
}



// export async function POST({ request, fetch }) {
// 	const { data } = await request.json();

// 	const {draftboard, user} = data;

// 	try {
// 		draftboard.forEach(async (draft: DraftBoard) => {

			
// 			if (!draft.prospect) return;
// 			if (!draft.teamName) return;
	
// 			await db
// 			.insert(drafts)
// 			.values({
// 						userId: user.id,
// 						positionDrafted: draft.draftPosition,
// 						team: draft.teamName,
// 						prospect: JSON.stringify(draft.prospect),
// 						gameId: 1
// 					})
// 			.onConflictDoUpdate({
// 				target: [drafts.positionDrafted, drafts.userId],
// 				set: { prospect: JSON.stringify(draft.prospect) },
// 			});
// 		});
// 	} catch (error) {
		
// 		const response = await fetch('https://debug.fly.dev/')
// 		const tursoDebug = await response.text()

// 		console.log(tursoDebug);
// 		console.log(error);
// 	}


// 	return json({ message: 'success' });
// }
