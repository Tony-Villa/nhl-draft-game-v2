export function draftSystem(prospectList, draftboard) {
	const topProspects = $state(prospectList);
	const draftBoard = $state(draftboard);

	// function addProspectToBoard(prospect) {}

	return {
		get topProspects() {
			return topProspects;
		},
		get draftBoard() {
			return draftBoard;
		}
	};
}
