import type { LadderEntry, LiveLeaderboardData } from '$lib/leaderboard/types';
import type { LadderQuery, LiveLeaderboardQuery } from '$lib/remote/leaderboard.schemas';
import { db } from '$lib/server/db/index.js';
import { draftBoardScores, gameEntries, games, users } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function getLiveLeaderboard(
	input: LiveLeaderboardQuery
): Promise<LiveLeaderboardData> {
	const leaderboard = await db
		.select({
			userId: users.id,
			userName: users.name,
			userAvatar: users.avatarUrl,
			score: draftBoardScores.score
		})
		.from(gameEntries)
		.innerJoin(users, eq(gameEntries.userId, users.id))
		.innerJoin(
			draftBoardScores,
			and(
				eq(gameEntries.selectedDraftBoardId, draftBoardScores.draftBoardId),
				eq(gameEntries.gameId, draftBoardScores.gameId)
			)
		)
		.where(eq(gameEntries.gameId, input.gameId))
		.orderBy(desc(draftBoardScores.score))
		.limit(input.limit);

	return {
		leaderboard,
		lastUpdated: new Date().toISOString()
	};
}

export async function getLadder(input: LadderQuery): Promise<LadderEntry[]> {
	return await db
		.select({
			id: gameEntries.userId,
			score: draftBoardScores.score,
			playerName: users.name,
			avatar: users.avatarUrl,
			year: games.year
		})
		.from(gameEntries)
		.innerJoin(users, eq(users.id, gameEntries.userId))
		.innerJoin(games, eq(games.id, gameEntries.gameId))
		.innerJoin(
			draftBoardScores,
			and(
				eq(draftBoardScores.draftBoardId, gameEntries.selectedDraftBoardId),
				eq(draftBoardScores.gameId, gameEntries.gameId)
			)
		)
		.where(eq(games.year, String(input.year)))
		.orderBy(desc(draftBoardScores.score))
		.limit(10);
}
