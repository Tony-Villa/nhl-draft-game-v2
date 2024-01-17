export function draftSystem(prospectList, draftboard) {
	const topProspects = $state(prospectList);
	const draftBoard = $state(draftboard);

	function addProspectToBoard(prospect, position = 1) {
		console.log(draftBoard);
		console.log(prospect);

		draftBoard[position - 1].prospect = prospect;
		console.log(draftBoard);
	}

	return {
		get topProspects() {
			return topProspects;
		},
		get draftBoard() {
			return draftBoard;
		},
		get addProspectToBoard() {
			return addProspectToBoard;
		}
	};
}
