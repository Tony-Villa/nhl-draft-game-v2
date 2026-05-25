import { eq } from 'drizzle-orm';
import { db } from './db';
import { games, scores } from './db/schema';

export const ensureDefaultScore = async (userId: string) => {
	const [defaultGame] = await db.select().from(games).where(eq(games.defaultGame, true));

	if (!defaultGame) {
		throw new Error('No default game configured');
	}



	await db
		.insert(scores)
		.values({
			gameId: defaultGame.id,
			userId,
			score: 0
		})
		.onConflictDoNothing();
};
