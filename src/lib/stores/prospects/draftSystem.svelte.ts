import type { Prospect, DraftBoard } from '$lib/types';

//#region types

export interface DraftSystem {
	readonly topProspects: Prospect[];
	readonly shownProspects: Prospect[];
	readonly draftBoard: DraftBoard[];
	readonly addProspectToBoard: (prospect: Prospect, position?: number) => void;
	readonly removeProspectFromBoard: (position?: number) => void;
}

//#endregion

export function draftSystem(prospectList: Prospect[], draftboard: DraftBoard[]): DraftSystem {
	const topProspects: Prospect[] = $state(prospectList);
	const draftBoard: DraftBoard[] = $state(draftboard);
	const shownProspects: Prospect[] = $state(prospectList);

	function addProspectToBoard(prospect: Prospect, position = 1) {
		draftBoard[position - 1].prospect = prospect;
	}

	function removeProspectFromBoard(position = 1) {
		draftBoard[position - 1].prospect = null;
	}

	return {
		get topProspects() {
			return topProspects;
		},
		get shownProspects() {
			return shownProspects;
		},
		get draftBoard() {
			return draftBoard;
		},
		get addProspectToBoard() {
			return addProspectToBoard;
		},
		get removeProspectFromBoard() {
			return removeProspectFromBoard;
		}
	};
}
