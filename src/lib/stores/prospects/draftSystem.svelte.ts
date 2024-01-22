import { supabase } from '$lib/supabase';
import type { Prospect, DraftBoard } from '$lib/types';

//#region types

export interface DraftSystem {
	readonly topProspects: Prospect[];
	readonly shownProspects: Prospect[];
	readonly draftBoard: DraftBoard[];
	readonly addProspectToBoard: (prospect: Prospect, position?: number) => void;
	readonly removeProspectFromBoard: (prospect: Prospect, position?: number) => void;
	filterProspects: (searchTerm: string) => void;
	submitDraftBoard: (draftboard: DraftBoard[]) => void;
}

//#endregion

export function draftSystem(prospectList: Prospect[], draftboard: DraftBoard[]): DraftSystem {
	const topProspects: Prospect[] = $state(prospectList);
	const draftBoard: DraftBoard[] = $state(draftboard);
	let shownProspects: Prospect[] = $state(prospectList);

	function addProspectToBoard(prospect: Prospect, position = 1) {
		draftBoard[position - 1].prospect = prospect;
		shownProspects.forEach((p) => {
			if (p.name === prospect.name) {
				p.drafted = true;
			}
		});

		console.log(draftBoard);
	}

	function removeProspectFromBoard(prospect: Prospect, position = 1) {
		draftBoard[position - 1].prospect = null;
		shownProspects.forEach((p) => {
			if (p.name === prospect.name) {
				p.drafted = false;
			}
		});
	}

	function filterProspects(searchTerm: string) {
		shownProspects = topProspects.filter(
			(prospect) =>
				searchTerm !== '' && prospect.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	async function submitDraftBoard(draftboard: DraftBoard[]) {
		const filteredDraftBoard = draftboard
			.filter((p) => p.prospect !== null)
			.map((p) => {
				return {
					user_id: '9137db17-9737-4ee9-ac1b-781761d5fbc4',
					prospect: p.prospect,
					team_name: p.teamName,
					position_drafted: p.draftPosition
				};
			});

		console.log('filtered draft board: ', filteredDraftBoard);

		const { data, error } = await supabase.from('user_draft').insert(filteredDraftBoard).select();

		if (error) {
			console.log(error);
		} else {
			console.log(data);
		}
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
		},
		get filterProspects() {
			return filterProspects;
		},
		get submitDraftBoard() {
			return submitDraftBoard;
		}
	};
}
