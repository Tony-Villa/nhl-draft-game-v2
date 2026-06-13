import type { DraftBoard, Prospect } from '$lib/types';

export function draftboardToMap(draftboard: DraftBoard[]) {
	const map: Record<string, DraftBoard[]> = {};

	draftboard.forEach((draft) => {
		if (draft.prospect) {
			map.draft = draftboard;
		}
	});

	return map;
}

export function restoreDraftBoard(savedValue: string | null, currentBoard: DraftBoard[]) {
	if (!savedValue) {
		return null;
	}

	try {
		const saved = JSON.parse(savedValue) as { draft?: unknown };

		if (!Array.isArray(saved.draft) || saved.draft.length !== currentBoard.length) {
			return null;
		}

		const savedDraft = saved.draft;
		const matchesCurrentBoard = savedDraft.every((savedCell, index) => {
			if (!savedCell || typeof savedCell !== 'object') {
				return false;
			}

			const cell = savedCell as Partial<DraftBoard>;
			const currentCell = currentBoard[index];

			return (
				cell.draftPosition === currentCell.draftPosition &&
				cell.teamName === currentCell.teamName &&
				(cell.prospect === null || isStoredProspect(cell.prospect))
			);
		});

		if (!matchesCurrentBoard) {
			return null;
		}

		return currentBoard.map((currentCell, index) => ({
			...currentCell,
			prospect: (savedDraft[index] as DraftBoard).prospect
		}));
	} catch {
		return null;
	}
}

function isStoredProspect(value: unknown): value is Prospect {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const prospect = value as Partial<Prospect>;

	return (
		typeof prospect.id === 'string' &&
		typeof prospect.rank === 'string' &&
		typeof prospect.name === 'string' &&
		typeof prospect.team === 'string' &&
		typeof prospect.league === 'string' &&
		typeof prospect.birthDay === 'string' &&
		typeof prospect.height === 'string' &&
		typeof prospect.weight === 'string' &&
		typeof prospect.shoots === 'string'
	);
}
