import { getContext, setContext } from "svelte";

interface NhlDraft {
  overallPick: string;
  prospect: string;
  team: string;
}

export class PointsSystem {
  userPoints = $state(0)
  hasOfficialDraftStarted = $state(false)
  officialNhlDraft: NhlDraft[] = $state([])

  constructor() {
    this.userPoints = 0
    this.hasOfficialDraftStarted = false
  }

  officialNhlDraftPickMade({ pick } : {pick: NhlDraft; }) {
    this.officialNhlDraft.push(pick)
  }

}

export function setPointsSystem() {
  const pointsSystem = new PointsSystem()
  setContext('POINT_SYSTEM', pointsSystem)
  return pointsSystem
}

export function getPointsSystem() {
  return getContext<PointsSystem>('POINT_SYSTEM')
}