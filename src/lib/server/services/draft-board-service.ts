import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	draftBoardPicks,
	draftBoards,
	gameEntries,
	games,
	prospects
} from '$lib/server/db/schema';
import type { DraftBoard, Prospect } from '$lib/types';

export const DEFAULT_DRAFT_BOARD_NAME = 'My Draft Board';

export async function getDefaultDraftBoard(userId: string, gameId: string) {
	const [board] = await db
		.select()
		.from(draftBoards)
		.where(
			and(
				eq(draftBoards.userId, userId),
				eq(draftBoards.gameId, gameId),
				eq(draftBoards.isDefault, true)
			)
		)
		.limit(1);

	return board;
}

export async function getOrCreateDefaultDraftBoard(userId: string, gameId: string) {
	const existingBoard = await getDefaultDraftBoard(userId, gameId);

	if (existingBoard) {
		return existingBoard;
	}

	await db
		.insert(draftBoards)
		.values({
			userId,
			gameId,
			name: DEFAULT_DRAFT_BOARD_NAME,
			status: 'draft',
			isDefault: true
		})
		.onConflictDoNothing({
			target: [draftBoards.userId, draftBoards.gameId, draftBoards.name]
		});

	const createdBoard = await getDefaultDraftBoard(userId, gameId);

	if (!createdBoard) {
		throw new Error('Failed to create default draft board');
	}

	return createdBoard;
}

export async function ensureGlobalGameEntry(userId: string, gameId: string, selectedDraftBoardId: number) {
	await db
		.insert(gameEntries)
		.values({
			userId,
			gameId,
			selectedDraftBoardId
		})
		.onConflictDoUpdate({
			target: [gameEntries.userId, gameEntries.gameId],
			set: {
				selectedDraftBoardId,
				updatedAt: sql`(cast (unixepoch() as int))`
			}
		});
}

export async function getSelectedGlobalDraftBoard(userId: string, gameId: string) {
	const [entry] = await db
		.select({
			boardId: gameEntries.selectedDraftBoardId
		})
		.from(gameEntries)
		.where(and(eq(gameEntries.userId, userId), eq(gameEntries.gameId, gameId)))
		.limit(1);

	if (entry) {
		const [board] = await db
			.select()
			.from(draftBoards)
			.where(eq(draftBoards.id, entry.boardId))
			.limit(1);

		if (board) {
			return board;
		}
	}

	return getDefaultDraftBoard(userId, gameId);
}

export async function getDraftBoardPicksWithProspects(draftBoardId: number) {
	return await db
		.select({
			draftPosition: draftBoardPicks.positionDrafted,
			team: draftBoardPicks.team,
			points: draftBoardPicks.points,
			prospectId: draftBoardPicks.prospectId,
			prospectRank: prospects.rank,
			prospectName: prospects.name,
			prospectPosition: prospects.position,
			prospectNation: prospects.nation,
			prospectTeam: prospects.team,
			prospectLeague: prospects.league,
			prospectBirthDay: prospects.birthDay,
			prospectHeight: prospects.height,
			prospectWeight: prospects.weight,
			prospectShoots: prospects.shoots,
			prospectDraftYear: prospects.draftYear
		})
		.from(draftBoardPicks)
		.leftJoin(prospects, eq(draftBoardPicks.prospectId, prospects.id))
		.where(eq(draftBoardPicks.draftBoardId, draftBoardId))
		.orderBy(asc(draftBoardPicks.positionDrafted));
}

export function transformDraftPickToBoardCell(
	draft: Awaited<ReturnType<typeof getDraftBoardPicksWithProspects>>[number]
): DraftBoard & { team?: string } {
	return {
		draftPosition: draft.draftPosition,
		teamName: draft.team,
		teamLogo: undefined,
		team: draft.team,
		points: draft.points,
		prospect: draft.prospectId
			? ({
					id: draft.prospectId,
					rank: draft.prospectRank,
					name: draft.prospectName,
					position: draft.prospectPosition,
					nation: draft.prospectNation,
					team: draft.prospectTeam,
					league: draft.prospectLeague,
					birthDay: draft.prospectBirthDay,
					height: draft.prospectHeight?.toString() || '',
					weight: draft.prospectWeight?.toString() || '',
					shoots: draft.prospectShoots
				} as Prospect)
			: null
	};
}

export async function getUserDraftBoardCells(userId: string, gameId: string) {
	const board = await getSelectedGlobalDraftBoard(userId, gameId);

	if (!board) {
		return { board: null, picks: [] };
	}

	const picks = await getDraftBoardPicksWithProspects(board.id);

	return {
		board,
		picks: picks.map(transformDraftPickToBoardCell)
	};
}

export function mergePicksIntoDraftBoard(baseDraftBoard: DraftBoard[], userPicks: DraftBoard[]) {
	return baseDraftBoard.map((basePosition) => {
		const userPick = userPicks.find((pick) => pick.draftPosition === basePosition.draftPosition);

		if (userPick) {
			return {
				...basePosition,
				...userPick,
				teamLogo: basePosition.teamLogo
			};
		}

		return basePosition;
	});
}

export async function assertGameIsEditable(gameId: string) {
	const [game] = await db
		.select({
			lockDate: games.lockDate,
			gamePhase: games.gamePhase
		})
		.from(games)
		.where(eq(games.id, gameId))
		.limit(1);

	if (!game) {
		throw new Error('Game not found');
	}

	const isLockedByDate = Date.now() >= new Date(game.lockDate).getTime();
	const isLockedByPhase = game.gamePhase !== 'open';

	if (isLockedByDate || isLockedByPhase) {
		throw new Error('Draft board is locked');
	}
}
