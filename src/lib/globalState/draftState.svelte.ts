import { getContext, setContext } from "svelte"

export interface DraftStateType {
  isDraftLocked: boolean;
  nhlDraftStarted: boolean;
  updateDraftStatus: (status: boolean) => void
}

class DraftState {
  isDraftLocked = $state(false)
  nhlDraftStarted = $state(false)

  constructor() {
    this.isDraftLocked = false
    this.nhlDraftStarted = false
  }

  updateDraftStatus(status: boolean) {
      this.isDraftLocked = status
  }

  startNhlDraft() {
    this.isDraftLocked = true;
    this.nhlDraftStarted = true
  }
}

export function setDraftState() {
  const draftState = new DraftState()
  setContext('DRAFT_CTX', draftState)
  return draftState
}

export function getDraftState() {
  return getContext<DraftState>('DRAFT_CTX')
}