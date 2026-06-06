import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	draftBoardPicks,
	draftBoardScores,
	draftBoards,
	gameEntries,
	nhlDraft,
	scores
} from '$lib/server/db/schema';

const STARTING_POINTS = 10;

export async function calculateDraftBoardScore(draftBoardId: number, gameId: string) {
	const nhlDraftPicks = await db
		.select({
			prospectId: nhlDraft.prospectId,
			positionDrafted: nhlDraft.positionDrafted
		})
		.from(nhlDraft)
		.where(eq(nhlDraft.gameId, +gameId));

	const boardPicks = await db
		.select({
			prospectId: draftBoardPicks.prospectId,
			positionDrafted: draftBoardPicks.positionDrafted
		})
		.from(draftBoardPicks)
		.where(eq(draftBoardPicks.draftBoardId, draftBoardId));

	let totalPoints = 0;

	for (const boardPick of boardPicks) {
		let pickPoints = 0;

		if (boardPick.prospectId) {
			const nhlPick = nhlDraftPicks.find((pick) => pick.prospectId === boardPick.prospectId);

			if (nhlPick) {
				const pointDifference = Math.abs(boardPick.positionDrafted - nhlPick.positionDrafted);
				pickPoints = Math.max(0, STARTING_POINTS - pointDifference);
				totalPoints += pickPoints;
			}
		}

		await db
			.update(draftBoardPicks)
			.set({
				points: pickPoints,
				updatedAt: sql`(cast (unixepoch() as int))`
			})
			.where(
				and(
					eq(draftBoardPicks.draftBoardId, draftBoardId),
					eq(draftBoardPicks.positionDrafted, boardPick.positionDrafted)
				)
			);
	}

	await db
		.insert(draftBoardScores)
		.values({
			draftBoardId,
			gameId,
			score: totalPoints
		})
		.onConflictDoUpdate({
			target: [draftBoardScores.draftBoardId, draftBoardScores.gameId],
			set: {
				score: totalPoints,
				updatedAt: sql`(cast (unixepoch() as int))`
			}
		});

	return totalPoints;
}

export async function scoreSubmittedDraftBoards(gameId: string) {
	const submittedBoards = await db
		.select({
			id: draftBoards.id,
			userId: draftBoards.userId
		})
		.from(draftBoards)
		.where(and(eq(draftBoards.gameId, gameId), eq(draftBoards.status, 'submitted')));

	const scoreResults = [];

	for (const board of submittedBoards) {
		const totalPoints = await calculateDraftBoardScore(board.id, gameId);

		scoreResults.push({
			draftBoardId: board.id,
			userId: board.userId,
			score: totalPoints
		});
	}

	const globalEntries = await db
		.select({
			userId: gameEntries.userId,
			selectedDraftBoardId: gameEntries.selectedDraftBoardId
		})
		.from(gameEntries)
		.where(eq(gameEntries.gameId, gameId));

	for (const entry of globalEntries) {
		const boardScore = scoreResults.find((score) => score.draftBoardId === entry.selectedDraftBoardId);

		await db
			.insert(scores)
			.values({
				userId: entry.userId,
				gameId,
				score: boardScore?.score || 0
			})
			.onConflictDoUpdate({
				target: [scores.userId, scores.gameId],
				set: {
					score: boardScore?.score || 0
				}
			});
	}

	return scoreResults.sort((a, b) => b.score - a.score);
}
