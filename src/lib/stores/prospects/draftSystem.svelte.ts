export function draftSystem(prospectList, draftboard) {
	const topProspects = $state(prospectList);
	const draftBoard = $state(draftboard);
	const shownProspects = $state(prospectList);

	function addProspectToBoard(prospect, position = 1) {
		draftBoard[position - 1].prospect = prospect;
		shownProspects.forEach((p) => {
			if (p.name === prospect.name) {
				p.drafted = true;
			}
		});
	}

	function removeProspectFromBoard(prospect, position = 1) {
		draftBoard[position - 1].prospect = null;
		shownProspects.forEach((p) => {
			if (p.name === prospect.name) {
				p.drafted = false;
			}
		});
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
