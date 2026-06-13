import { describe, expect, it } from 'vitest';
import type { DraftBoard } from '$lib/types';
import { draftboardToMap, restoreDraftBoard } from './draftboard-to-map';

const prospect = {
	id: '1',
	rank: '1',
	name: 'Prospect',
	position: 'C',
	nation: 'CAN',
	team: 'Team',
	league: 'League',
	birthDay: '01/01/2008',
	height: '72',
	weight: '180',
	shoots: 'L'
};

const board: DraftBoard[] = [
	{
		draftPosition: 1,
		teamLogo: '/team.svg',
		teamName: 'Toronto Maple Leafs',
		prospect: null,
		points: null
	}
];

describe('anonymous draft storage', () => {
	it('stores a board only when it contains a pick', () => {
		expect(draftboardToMap(board)).toEqual({});
		expect(draftboardToMap([{ ...board[0], prospect }])).toHaveProperty('draft');
	});

	it('restores a saved board that matches the current draft order', () => {
		const savedBoard = [
			{
				...board[0],
				prospect
			}
		];

		expect(restoreDraftBoard(JSON.stringify({ draft: savedBoard }), board)).toEqual(savedBoard);
	});

	it('ignores malformed or stale saved boards', () => {
		expect(restoreDraftBoard('not-json', board)).toBeNull();
		expect(
			restoreDraftBoard(
				JSON.stringify({ draft: [{ ...board[0], teamName: 'San Jose Sharks' }] }),
				board
			)
		).toBeNull();
	});
});
