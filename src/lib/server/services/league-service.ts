import { and, desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import {
	draftBoards,
	draftBoardScores,
	gameEntries,
	games,
	leagueMembers,
	leagues,
	users
} from '$lib/server/db/schema';
import {
	ensureGlobalGameEntry,
	getOrCreateDefaultDraftBoard,
	getSelectedGlobalDraftBoard,
	getUserDraftBoardById
} from './draft-board-service.js';

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48);
}

function randomToken(length = 8) {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let token = '';

	for (let i = 0; i < length; i += 1) {
		token += alphabet[Math.floor(Math.random() * alphabet.length)];
	}

	return token;
}

async function createUniqueSlug(name: string) {
	const baseSlug = slugify(name) || 'league';

	for (let attempt = 0; attempt < 6; attempt += 1) {
		const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomToken(4).toLowerCase()}`;
		const [existing] = await db.select({ id: leagues.id }).from(leagues).where(eq(leagues.slug, slug));

		if (!existing) {
			return slug;
		}
	}

	return `${baseSlug}-${Date.now()}`;
}

async function createUniqueInviteCode() {
	for (let attempt = 0; attempt < 6; attempt += 1) {
		const inviteCode = randomToken();
		const [existing] = await db
			.select({ id: leagues.id })
			.from(leagues)
			.where(eq(leagues.inviteCode, inviteCode));

		if (!existing) {
			return inviteCode;
		}
	}

	return `${randomToken(6)}${Date.now().toString(36).toUpperCase()}`;
}

export async function getDefaultGame() {
	const [game] = await db.select().from(games).where(eq(games.defaultGame, true)).limit(1);

	if (!game) {
		throw new Error('No default game configured');
	}

	return game;
}

export async function getSubmittedBoardForLeagueEntry(userId: string, gameId = CURRENT_GAME) {
	const selectedBoard = await getSelectedGlobalDraftBoard(userId, gameId);

	if (selectedBoard?.status === 'submitted') {
		return selectedBoard;
	}

	const defaultBoard = await getOrCreateDefaultDraftBoard(userId, gameId);

	if (defaultBoard.status !== 'submitted') {
		return null;
	}

	await ensureGlobalGameEntry(userId, gameId, defaultBoard.id);
	return defaultBoard;
}

export async function setLeagueMemberBoard({
	leagueId,
	userId,
	gameId,
	draftBoardId
}: {
	leagueId: number;
	userId: string;
	gameId: string;
	draftBoardId: number;
}) {
	const board = await getUserDraftBoardById(userId, gameId, draftBoardId);

	if (!board) {
		throw new Error('Draft board not found.');
	}

	if (board.status !== 'submitted') {
		throw new Error('Submit this draft board before using it in a league.');
	}

	await db
		.update(leagueMembers)
		.set({
			selectedDraftBoardId: draftBoardId,
			updatedAt: sql`(cast (unixepoch() as int))`
		})
		.where(and(eq(leagueMembers.leagueId, leagueId), eq(leagueMembers.userId, userId)));
}

export async function createLeague({
	userId,
	name,
	description
}: {
	userId: string;
	name: string;
	description?: string;
}) {
	const game = await getDefaultGame();
	const selectedBoard = await getSubmittedBoardForLeagueEntry(userId, game.id);

	if (!selectedBoard) {
		throw new Error('Submit a draft board before creating a league.');
	}

	const slug = await createUniqueSlug(name);
	const inviteCode = await createUniqueInviteCode();

	const result = await db
		.insert(leagues)
		.values({
			gameId: game.id,
			ownerUserId: userId,
			name,
			slug,
			inviteCode,
			description: description || null
		})
		.returning({ id: leagues.id, slug: leagues.slug });

	const league = result[0];

	await db.insert(leagueMembers).values({
		leagueId: league.id,
		userId,
		selectedDraftBoardId: selectedBoard.id,
		role: 'owner'
	});

	return league;
}

export async function joinLeague({
	userId,
	inviteCode
}: {
	userId: string;
	inviteCode: string;
}) {
	const normalizedInviteCode = inviteCode.trim().toUpperCase();

	const [league] = await db
		.select()
		.from(leagues)
		.where(and(eq(leagues.inviteCode, normalizedInviteCode), eq(leagues.status, 'active')))
		.limit(1);

	if (!league) {
		throw new Error('No active league found for that invite code.');
	}

	const [game] = await db.select().from(games).where(eq(games.id, league.gameId)).limit(1);

	if (!game) {
		throw new Error('League game not found.');
	}

	if (game.gamePhase === 'started' || game.gamePhase === 'finalized') {
		throw new Error('This league is closed because the draft has already started.');
	}

	const selectedBoard = await getSubmittedBoardForLeagueEntry(userId, league.gameId);

	if (!selectedBoard) {
		throw new Error('Submit a draft board before joining a league.');
	}

	await db
		.insert(leagueMembers)
		.values({
			leagueId: league.id,
			userId,
			selectedDraftBoardId: selectedBoard.id,
			role: league.ownerUserId === userId ? 'owner' : 'member'
		})
		.onConflictDoUpdate({
			target: [leagueMembers.leagueId, leagueMembers.userId],
			set: {
				selectedDraftBoardId: selectedBoard.id,
				updatedAt: sql`(cast (unixepoch() as int))`
			}
		});

	return league;
}

export async function getUserLeagues(userId: string, gameId = CURRENT_GAME) {
	return await db
		.select({
			id: leagues.id,
			name: leagues.name,
			slug: leagues.slug,
			description: leagues.description,
			role: leagueMembers.role,
			memberCount: sql<number>`(
				SELECT COUNT(*) FROM ${leagueMembers}
				WHERE ${leagueMembers.leagueId} = ${leagues.id}
			)`,
			score: draftBoardScores.score
		})
		.from(leagueMembers)
		.innerJoin(leagues, eq(leagueMembers.leagueId, leagues.id))
		.leftJoin(
			draftBoardScores,
			and(
				eq(draftBoardScores.draftBoardId, leagueMembers.selectedDraftBoardId),
				eq(draftBoardScores.gameId, leagues.gameId)
			)
		)
		.where(and(eq(leagueMembers.userId, userId), eq(leagues.gameId, gameId)))
		.orderBy(desc(leagues.createdAt));
}

export async function getLeagueForMember(slug: string, userId: string) {
	const [league] = await db
		.select({
			id: leagues.id,
			gameId: leagues.gameId,
			ownerUserId: leagues.ownerUserId,
			name: leagues.name,
			slug: leagues.slug,
			inviteCode: leagues.inviteCode,
			description: leagues.description,
			status: leagues.status,
			role: leagueMembers.role,
			selectedDraftBoardId: leagueMembers.selectedDraftBoardId
		})
		.from(leagues)
		.innerJoin(leagueMembers, eq(leagueMembers.leagueId, leagues.id))
		.where(and(eq(leagues.slug, slug), eq(leagueMembers.userId, userId)))
		.limit(1);

	return league;
}

export async function getLeagueLeaderboard(leagueId: number, gameId: string) {
	return await db
		.select({
			userId: users.id,
			userName: users.name,
			userAvatar: users.avatarUrl,
			role: leagueMembers.role,
			selectedDraftBoardId: leagueMembers.selectedDraftBoardId,
			score: draftBoardScores.score
		})
		.from(leagueMembers)
		.innerJoin(users, eq(leagueMembers.userId, users.id))
		.leftJoin(
			draftBoardScores,
			and(
				eq(draftBoardScores.draftBoardId, leagueMembers.selectedDraftBoardId),
				eq(draftBoardScores.gameId, gameId)
			)
		)
		.where(eq(leagueMembers.leagueId, leagueId))
		.orderBy(desc(draftBoardScores.score));
}

export function requireLeagueMember(league: Awaited<ReturnType<typeof getLeagueForMember>>) {
	if (!league) {
		throw redirect(303, '/draft-center/leagues');
	}

	return league;
}
