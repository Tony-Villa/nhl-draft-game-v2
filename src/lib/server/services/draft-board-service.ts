import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	draftBoardPicks,
	draftBoards,
	gameEntries,
	games,
	leagueMembers,
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

export async function getUserDraftBoardById(userId: string, gameId: string, draftBoardId: number) {
	const [board] = await db
		.select()
		.from(draftBoards)
		.where(
			and(
				eq(draftBoards.id, draftBoardId),
				eq(draftBoards.userId, userId),
				eq(draftBoards.gameId, gameId)
			)
		)
		.limit(1);

	return board;
}

export async function getUserDraftBoards(userId: string, gameId: string) {
	const boards = await db
		.select({
			id: draftBoards.id,
			name: draftBoards.name,
			status: draftBoards.status,
			isDefault: draftBoards.isDefault,
			createdAt: draftBoards.createdAt,
			updatedAt: draftBoards.updatedAt,
			submittedAt: draftBoards.submittedAt,
			pickCount: sql<number>`(
				SELECT COUNT(*) FROM ${draftBoardPicks}
				WHERE ${draftBoardPicks.draftBoardId} = ${draftBoards.id}
			)`,
			globalEntryCount: sql<number>`(
				SELECT COUNT(*) FROM ${gameEntries}
				WHERE ${gameEntries.selectedDraftBoardId} = ${draftBoards.id}
			)`,
			leagueEntryCount: sql<number>`(
				SELECT COUNT(*) FROM ${leagueMembers}
				WHERE ${leagueMembers.selectedDraftBoardId} = ${draftBoards.id}
			)`
		})
		.from(draftBoards)
		.where(and(eq(draftBoards.userId, userId), eq(draftBoards.gameId, gameId)))
		.orderBy(asc(draftBoards.createdAt));

	return boards;
}

export async function renameDraftBoard({
	userId,
	gameId,
	draftBoardId,
	name
}: {
	userId: string;
	gameId: string;
	draftBoardId: number;
	name: string;
}) {
	await assertGameIsEditable(gameId);

	const board = await getUserDraftBoardById(userId, gameId, draftBoardId);

	if (!board) {
		throw new Error('Draft board not found');
	}

	const trimmedName = name.trim();

	if (trimmedName.length < 2 || trimmedName.length > 60) {
		throw new Error('Board name must be between 2 and 60 characters.');
	}

	const duplicateName = (await getUserDraftBoards(userId, gameId)).some(
		(candidate) =>
			candidate.id !== board.id &&
			candidate.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
	);

	if (duplicateName) {
		throw new Error('You already have a board with that name.');
	}

	await db
		.update(draftBoards)
		.set({
			name: trimmedName,
			updatedAt: sql`(cast (unixepoch() as int))`
		})
		.where(eq(draftBoards.id, board.id));
}

export async function deleteDraftBoard({
	userId,
	gameId,
	draftBoardId
}: {
	userId: string;
	gameId: string;
	draftBoardId: number;
}) {
	await assertGameIsEditable(gameId);

	const boards = await getUserDraftBoards(userId, gameId);
	const board = boards.find((candidate) => candidate.id === draftBoardId);

	if (!board) {
		throw new Error('Draft board not found');
	}

	if (boards.length === 1) {
		throw new Error('You must keep at least one draft board.');
	}

	if (board.isDefault || board.globalEntryCount > 0) {
		throw new Error('Choose another global board before deleting this one.');
	}

	if (board.leagueEntryCount > 0) {
		throw new Error('Choose another board in each league before deleting this one.');
	}

	await db.delete(draftBoards).where(eq(draftBoards.id, board.id));
}

export async function createDraftBoard({
	userId,
	gameId,
	name
}: {
	userId: string;
	gameId: string;
	name: string;
}) {
	await assertGameIsEditable(gameId);

	const [board] = await db
		.insert(draftBoards)
		.values({
			userId,
			gameId,
			name,
			status: 'draft',
			isDefault: false
		})
		.returning({ id: draftBoards.id });

	return board;
}

export async function duplicateDraftBoard({
	userId,
	gameId,
	sourceDraftBoardId,
	name
}: {
	userId: string;
	gameId: string;
	sourceDraftBoardId: number;
	name: string;
}) {
	await assertGameIsEditable(gameId);

	const sourceBoard = await getUserDraftBoardById(userId, gameId, sourceDraftBoardId);

	if (!sourceBoard) {
		throw new Error('Draft board not found');
	}

	const [newBoard] = await db
		.insert(draftBoards)
		.values({
			userId,
			gameId,
			name,
			status: 'draft',
			isDefault: false
		})
		.returning({ id: draftBoards.id });

	const sourcePicks = await db
		.select()
		.from(draftBoardPicks)
		.where(eq(draftBoardPicks.draftBoardId, sourceDraftBoardId));

	for (const pick of sourcePicks) {
		await db.insert(draftBoardPicks).values({
			draftBoardId: newBoard.id,
			positionDrafted: pick.positionDrafted,
			team: pick.team,
			prospectId: pick.prospectId,
			points: null
		});
	}

	return newBoard;
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

export async function getUserDraftBoardCells(userId: string, gameId: string, draftBoardId?: number) {
	const board = draftBoardId
		? await getUserDraftBoardById(userId, gameId, draftBoardId)
		: await getSelectedGlobalDraftBoard(userId, gameId);

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
