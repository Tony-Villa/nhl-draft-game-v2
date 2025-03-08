// import ToastDraft from '$lib/components/ToastDraft.svelte';
import { ordinalNumbers } from '$lib/helpers/ordinal-numbers';
import type { DraftBoard as DraftBoardType, Prospect } from '$lib/types';
import { getContext, setContext } from 'svelte';
import toast from 'svelte-french-toast';

class ProspectDraftSystem {
	prospects: Prospect[] = $state([]);
	draftBoard: DraftBoardType[] = $state([]);
	nhlDraftBoard: DraftBoardType[] = $state([])

	constructor(initialProspects: Prospect[], initialDraftBoard: DraftBoardType[], emptyDraftBoard: DraftBoardType[]) {
		this.prospects = initialProspects;
		this.draftBoard = initialDraftBoard;
		this.nhlDraftBoard = emptyDraftBoard;
	}

	setNewInitialDraftBoard(newDraftBoard: DraftBoardType[]) {
		for (const draft of newDraftBoard) {
			if (draft.prospect) {
				this.draftProspect(draft.prospect);
			}
		}
		this.draftBoard = newDraftBoard;
	}

	addProspectToBoard(prospect: Prospect, position = 1) {
		this.draftProspect(prospect);
		this.draftBoard[position - 1].prospect = prospect;

		toast.success(`With the ${ordinalNumbers(position)} overall pick, the ${this.draftBoard[position - 1].teamName} select ${prospect.name}!`, {
			duration: 5000,
		});

		// TODO: Create custom toast component
		// toast(ToastDraft, { props: { someProp: '⭐' }})

	}


	computePoints(){
		let startingPoints = 10;
		let tempProspectCompare: Record<string,Record<string,number>> = {}

		for(let i = 0; i < this.draftBoard.length; i++) {
			if(!this.draftBoard[i].prospect) {
				continue
			} 

			if(this.draftBoard[i]?.prospect?.name) {
				tempProspectCompare[this.draftBoard[i].prospect?.name as string] = {...tempProspectCompare[this.draftBoard[i].prospect?.name as string], user: this.draftBoard[i].draftPosition }
			}
		}
		
		for(let i = 0; i < this.nhlDraftBoard.length; i++) {
			if(!this.nhlDraftBoard[i].prospect?.name) {
				continue
			} 
			
			if(this.nhlDraftBoard[i].prospect?.name) {
				tempProspectCompare[this.nhlDraftBoard[i].prospect?.name as string] = {...tempProspectCompare[this.nhlDraftBoard[i].prospect?.name as string], nhl: this.nhlDraftBoard[i].draftPosition }
			}
		}

		for(let i = 0; i < this.draftBoard.length; i++) {
			if(!this.draftBoard[i].prospect) {
				this.draftBoard[i].points = 0
				continue;	
			} 

			if(this.draftBoard[i].prospect?.name && tempProspectCompare?.[this.draftBoard[i].prospect?.name as string]) {
				// this is dumb ass code but it works, fix it later
				this.draftBoard[i].points = startingPoints - Math.abs(tempProspectCompare[this.draftBoard[i].prospect?.name as string]?.user - tempProspectCompare[this.draftBoard[i].prospect?.name as string]?.nhl) < 0 ? 0 : startingPoints - Math.abs(tempProspectCompare[this.draftBoard[i].prospect?.name as string]?.user - tempProspectCompare[this.draftBoard[i].prospect?.name as string]?.nhl)
			}
		}

		
		return this.draftBoard.reduce((acc,d) => acc + (d.points || 0), 0)
		
 		
	}

	removeProspectFromBoard(prospect: Prospect, position = 1) {
		this.undraftProspect(prospect);
		this.draftBoard[position - 1].prospect = null;
	}

	addNhlPick(prospectName: string, position: number){
		this.nhlDraftBoard[position].prospect = {name: prospectName} as any
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

export function setDraftSystem(prospects: Prospect[], draftBoard: DraftBoardType[], emptyDraftBoard: DraftBoardType[] ) {
	const prospectsState = new ProspectDraftSystem(prospects, draftBoard, emptyDraftBoard);
	setContext(PROSPECT_CTX, prospectsState);
	return prospectsState;
}

export function getDraftSystem() {
	return getContext<ProspectDraftSystem>(PROSPECT_CTX);
}
