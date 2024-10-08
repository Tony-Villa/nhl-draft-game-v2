import { getContext, setContext } from "svelte"

type CurrentDraftState = "open" | "locked" | "started" | "finalized"
export interface DraftStateType {
  isDraftLocked: boolean;
  currentState: CurrentDraftState;
  nhlDraft: ProspectDrafted[];
  nhlDraftCurrentPick: number;
  updateDraftStatus: (status: boolean) => void
  startNhlDraft: () => void
  currentNhlDraft: (pick: ProspectDrafted[]) => void
  updateNhlDraftPick: (number: number) => void
}

interface ProspectDrafted {
  position: number;
  name: string;
}

class DraftState {
  isDraftLocked = $state(false)
  currentState = $state("open")
  nhlDraftCurrentPick = $state(0)

  constructor(phase : CurrentDraftState, initPick: number) {
    this.isDraftLocked = false
    this.currentState = phase
    this.nhlDraftCurrentPick = initPick
  }

  updateDraftStatus(status: boolean) {
      this.isDraftLocked = status
  }

  startNhlDraft() {
    this.isDraftLocked = true;
    this.currentState = "started"
  }

  updateNhlDraftPick(pick: number) {
    this.nhlDraftCurrentPick = pick
  }


}

export function setDraftState(phase: CurrentDraftState, initPick: number) {
  const draftState = new DraftState(phase, initPick)
  setContext('DRAFT_CTX', draftState)
  return draftState
}

export function getDraftState() {
  return getContext<DraftStateType>('DRAFT_CTX')
}