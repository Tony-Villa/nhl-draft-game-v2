<script lang="ts">
	import ShareDraft from './ShareDraft.svelte';
	import Button from './Button.svelte';
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	
	const draftSystem = getDraftSystem();
	
	// Mock some draft picks for testing
	function addMockPicks() {
		// Create some fake prospects for testing
		const mockProspects = [
			{ id: '1', name: 'John Doe', position: 'C', team: 'Boston College', rank: '1', nation: 'CAN', league: 'NCAA', birthDay: '2005-01-15', height: '6-2', weight: '180', shoots: 'L' },
			{ id: '2', name: 'Jane Smith', position: 'LW', team: 'London Knights', rank: '2', nation: 'USA', league: 'OHL', birthDay: '2005-03-22', height: '5-11', weight: '175', shoots: 'R' },
			{ id: '3', name: 'Mike Johnson', position: 'D', team: 'Medicine Hat', rank: '3', nation: 'CAN', league: 'WHL', birthDay: '2005-05-10', height: '6-1', weight: '190', shoots: 'L' },
			{ id: '4', name: 'Sarah Wilson', position: 'RW', team: 'USNTDP', rank: '4', nation: 'USA', league: 'USHL', birthDay: '2005-07-08', height: '5-10', weight: '165', shoots: 'R' },
			{ id: '5', name: 'Alex Brown', position: 'C', team: 'Shawinigan', rank: '5', nation: 'CAN', league: 'QMJHL', birthDay: '2005-02-18', height: '6-0', weight: '185', shoots: 'L' },
			{ id: '6', name: 'Emma Davis', position: 'D', team: 'Seattle', rank: '6', nation: 'USA', league: 'WHL', birthDay: '2005-04-12', height: '5-9', weight: '170', shoots: 'R' },
			{ id: '7', name: 'Chris Miller', position: 'G', team: 'Guelph Storm', rank: '7', nation: 'CAN', league: 'OHL', birthDay: '2005-06-25', height: '6-3', weight: '195', shoots: 'L' },
			{ id: '8', name: 'Taylor Green', position: 'LW', team: 'U. of Michigan', rank: '8', nation: 'USA', league: 'NCAA', birthDay: '2005-01-30', height: '5-11', weight: '180', shoots: 'L' },
			{ id: '9', name: 'Jordan White', position: 'C', team: 'Kamloops', rank: '9', nation: 'CAN', league: 'WHL', birthDay: '2005-03-14', height: '6-1', weight: '185', shoots: 'R' },
			{ id: '10', name: 'Casey Black', position: 'D', team: 'Oshawa', rank: '10', nation: 'CAN', league: 'OHL', birthDay: '2005-05-20', height: '6-2', weight: '200', shoots: 'L' }
		];
		
		// Add each mock prospect to positions 1-10
		mockProspects.forEach((prospect, index) => {
			draftSystem.addProspectToBoard(prospect, index + 1);
		});
		
		// Ensure the draft board has team logos (they should already be there from the base draft board)
		console.log('Mock picks added! Check draft board for team logos:', draftSystem.draftBoard.slice(0, 10));
	}
	
	function clearAllPicks() {
		// Clear all picks from positions 1-10
		for (let i = 1; i <= 10; i++) {
			const prospect = draftSystem.draftBoard[i - 1].prospect;
			if (prospect) {
				draftSystem.removeProspectFromBoard(prospect, i);
			}
		}
	}
</script>

<!-- Development Testing Panel -->
<div class="fixed top-4 right-4 z-50 bg-yellow-200 border-[3px] border-black p-4 shadow-brut-shadow">
	<h3 class="font-bold mb-2 text-sm uppercase">🧪 Dev Testing</h3>
	<div class="flex flex-col gap-2">
		<Button variant="outline" size="sm" onclick={addMockPicks}>
			Add Mock Picks
		</Button>
		<Button variant="outline" size="sm" onclick={clearAllPicks}>
			Clear All Picks
		</Button>
		<ShareDraft />
	</div>
	<p class="text-xs mt-2 text-gray-600">Remove this component before production!</p>
</div>
