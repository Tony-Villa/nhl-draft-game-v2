// import ToastDraft from '$lib/components/ToastDraft.svelte';
import { ordinalNumbers } from '$lib/helpers/ordinal-numbers';
import type { DraftBoard as DraftBoardType, Prospect } from '$lib/types';
import { getContext, setContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import toast from 'svelte-french-toast';

class ProspectDraftSystem {
	prospects: Prospect[] = $state([]);
	draftBoard: DraftBoardType[] = $state([]);
	nhlDraftBoard: DraftBoardType[] = $state([]);
	
	// Track drafted prospects by ID using Svelte's reactive Set
	permanentDraftedIds = $state(new SvelteSet<string>());
	temporaryDraftedIds = $state(new SvelteSet<string>());
	
	// Track prospects that have been undrafted (so API knows to remove them from DB)
	undraftedProspectIds = $state(new SvelteSet<string>());

	constructor(initialProspects: Prospect[], initialDraftBoard: DraftBoardType[], emptyDraftBoard: DraftBoardType[]) {
		this.prospects = initialProspects;
		this.draftBoard = initialDraftBoard;
		this.nhlDraftBoard = emptyDraftBoard;
	}

	/**
	 * Set permanently drafted prospects from database
	 */
	setPermanentDrafted(prospectIds: string[]) {
		this.permanentDraftedIds.clear();
		prospectIds.forEach(id => this.permanentDraftedIds.add(id));
	}

	/**
	 * Check if a prospect is drafted (either permanently or temporarily)
	 */
	isDrafted(prospectId: string): boolean {
		return this.permanentDraftedIds.has(prospectId) || this.temporaryDraftedIds.has(prospectId);
	}

	/**
	 * Check if a prospect is temporarily drafted (not yet submitted)
	 */
	isTemporarilyDrafted(prospectId: string): boolean {
		return this.temporaryDraftedIds.has(prospectId);
	}

	/**
	 * Get available (undrafted) prospects
	 */
	get availableProspects(): Prospect[] {
		return this.prospects.filter(prospect => 
			prospect.id && !this.isDrafted(prospect.id)
		);
	}

	/**
	 * Get prospects with draft status for UI
	 */
	get prospectsWithStatus() {
		return this.prospects.map(prospect => ({
			...prospect,
			isDrafted: prospect.id ? this.isDrafted(prospect.id) : false,
			isTemporary: prospect.id ? this.isTemporarilyDrafted(prospect.id) : false,
			isPermanent: prospect.id ? this.permanentDraftedIds.has(prospect.id) : false
		}));
	}

	setNewInitialDraftBoard(newDraftBoard: DraftBoardType[]) {
		for (const draft of newDraftBoard) {
			if (draft.prospect?.id) {
				this.temporaryDraftedIds.add(draft.prospect.id);
			}
		}
		this.draftBoard = newDraftBoard;
	}

	addProspectToBoard(prospect: Prospect, position = 1) {
		// Check if this prospect is already drafted elsewhere and remove them first
		if (prospect.id && this.temporaryDraftedIds.has(prospect.id)) {
			// Find the current position and remove the prospect
			const currentPosition = this.draftBoard.findIndex(cell => cell.prospect?.id === prospect.id);
			if (currentPosition !== -1) {
				this.draftBoard[currentPosition].prospect = null;
			}
		}
		
		// Add prospect to the new position
		if (prospect.id) {
			this.temporaryDraftedIds.add(prospect.id);
			// Remove from undrafted list if they were previously undrafted (they're being re-drafted)
			this.undraftedProspectIds.delete(prospect.id);
		}
		this.draftBoard[position - 1].prospect = prospect;

		toast.success(`With the ${ordinalNumbers(position)} overall pick, the ${this.draftBoard[position - 1].teamName} select ${prospect.name}!`, {
			duration: 5000,
		});

		// TODO: Create custom toast component
		// toast(ToastDraft, { props: { someProp: '⭐' }})
	}

	removeProspectFromBoard(prospect: Prospect, position = 1) {
		if (prospect.id) {
			// If this was a permanently drafted prospect, track that it's been undrafted
			if (this.permanentDraftedIds.has(prospect.id)) {
				this.undraftedProspectIds.add(prospect.id);
			}
			
			// Remove from both temporary and permanent drafts
			// This allows users to immediately re-draft prospects that were previously submitted
			this.temporaryDraftedIds.delete(prospect.id);
			this.permanentDraftedIds.delete(prospect.id);
		}
		this.draftBoard[position - 1].prospect = null;
	}

	/**
	 * Clear all temporary drafts (e.g., when submitting draft)
	 */
	clearTemporaryDrafts() {
		this.temporaryDraftedIds.clear();
		this.undraftedProspectIds.clear(); // Also clear undrafted tracking after submission
	}

	/**
	 * Get all temporarily drafted prospect IDs
	 */
	getTemporaryDrafts(): string[] {
		return Array.from(this.temporaryDraftedIds);
	}

	/**
	 * Move temporary drafts to permanent (after successful submission)
	 */
	commitTemporaryDrafts() {
		this.temporaryDraftedIds.forEach(id => this.permanentDraftedIds.add(id));
		this.clearTemporaryDrafts();
	}


	computePoints(){
		const startingPoints = 10;
		
		// Create a map of prospect ID to NHL draft position for O(1) lookup
		const nhlDraftPositions = new Map<string, number>();
		this.nhlDraftBoard.forEach((pick, index) => {
			if (pick.prospect?.id) {
				nhlDraftPositions.set(pick.prospect.id, pick.draftPosition);
			}
		});

		// Calculate points for each user draft pick
		this.draftBoard.forEach(draft => {
			if (!draft.prospect?.id) {
				draft.points = 0;
				return;
			}

			const nhlPosition = nhlDraftPositions.get(draft.prospect.id);
			
			if (nhlPosition !== undefined) {
				// Calculate points: 10 - |user_position - nhl_position|, minimum 0
				const pointDifference = Math.abs(draft.draftPosition - nhlPosition);
				draft.points = Math.max(0, startingPoints - pointDifference);
			} else {
				// Prospect wasn't drafted in NHL first round
				draft.points = 0;
			}
		});

		return this.draftBoard.reduce((acc, d) => acc + (d.points || 0), 0);
	}

	addNhlPick(prospectName: string, position: number){
		this.nhlDraftBoard[position].prospect = {name: prospectName} as any
	}

	/**
	 * Get current state summary for debugging
	 */
	getStateSummary() {
		return {
			temporaryCount: this.temporaryDraftedIds.size,
			permanentCount: this.permanentDraftedIds.size,
			undraftedCount: this.undraftedProspectIds.size,
			temporaryIds: Array.from(this.temporaryDraftedIds),
			permanentIds: Array.from(this.permanentDraftedIds),
			undraftedIds: Array.from(this.undraftedProspectIds)
		};
	}
}

const PROSPECT_CTX = 'PROSPECT_CTX';

export function setDraftSystem(prospects: Prospect[], draftBoard: DraftBoardType[], emptyDraftBoard: DraftBoardType[] ) {
	const prospectsState = new ProspectDraftSystem(prospects, draftBoard, emptyDraftBoard);
	
	// Extract permanently drafted prospect IDs from the draft board
	const permanentlyDraftedIds: string[] = [];
	for (const draft of draftBoard) {
		if (draft.prospect?.id) {
			permanentlyDraftedIds.push(draft.prospect.id);
		}
	}
	
	// Set permanently drafted prospects
	prospectsState.setPermanentDrafted(permanentlyDraftedIds);
	
	setContext(PROSPECT_CTX, prospectsState);
	return prospectsState;
}

export function getDraftSystem() {
	return getContext<ProspectDraftSystem>(PROSPECT_CTX);
}

export { ProspectDraftSystem };
