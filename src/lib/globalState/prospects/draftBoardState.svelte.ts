import type { DraftBoard as DraftBoardType, Prospect } from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getProspects } from './prospectsState.svelte';

class DraftBoard {
	draftBoard: DraftBoardType[] = $state([]);

	constructor(initialDraftBoard: DraftBoardType[]) {
		this.draftBoard = initialDraftBoard;
	}

	addProspectToBoard(prospect: Prospect, position = 1) {
		this.draftBoard[position - 1].prospect = prospect;
	}

	removeProspectFromBoard(_prospect: Prospect, position = 1) {
		this.draftBoard[position - 1].prospect = null;
	}
}

const DRAFT_BOARD_CTX = 'DRAFT_BOARD_CTX';

export function setDraftBoard(draftBoard: DraftBoardType[]) {
	const draftBoardState = new DraftBoard(draftBoard);
	setContext(DRAFT_BOARD_CTX, draftBoardState);
	return draftBoardState;
}

export function getDraftBoard() {
	return getContext<DraftBoard>(DRAFT_BOARD_CTX);
}
