import type { DraftBoard as DraftBoardType, Prospect } from '$lib/types';
import { getContext, setContext } from 'svelte';

class ProspectDraftSystem {
	prospects: Prospect[] = $state([]);
	draftBoard: DraftBoardType[] = $state([]);

	constructor(initialProspects: Prospect[], initialDraftBoard: DraftBoardType[]) {
		this.prospects = initialProspects;
		this.draftBoard = initialDraftBoard;
	}

	addProspectToBoard(prospect: Prospect, position = 1) {
		this.draftProspect(prospect);
		this.draftBoard[position - 1].prospect = prospect;
	}

	removeProspectFromBoard(prospect: Prospect, position = 1) {
		this.undraftProspect(prospect);
		this.draftBoard[position - 1].prospect = null;
	}

	draftProspect(prospect: Prospect) {
		for (const p of this.prospects) {
			if (p.name === prospect?.name) {
				p.drafted = true;
			}
		}
	}

	undraftProspect(prospect: Prospect) {
		for (const p of this.prospects) {
			if (p.name === prospect?.name) {
				p.drafted = false;
			}
		}
	}
}

const PROSPECT_CTX = 'PROSPECT_CTX';

export function setDraftSystem(prospects: Prospect[], draftBoard: DraftBoardType[]) {
	const prospectsState = new ProspectDraftSystem(prospects, draftBoard);
	setContext(PROSPECT_CTX, prospectsState);
	return prospectsState;
}

export function getDraftSystem() {
	return getContext<ProspectDraftSystem>(PROSPECT_CTX);
}
