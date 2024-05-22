import { getContext, setContext } from "svelte"

export interface DraftStateType {
  isDraftLocked: boolean;
  updateDraftStatus: (status: boolean) => void
}

class DraftState {
  isDraftLocked = $state(false)

  constructor() {
    this.isDraftLocked = false
  }

  updateDraftStatus(status: boolean) {
      this.isDraftLocked = status
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