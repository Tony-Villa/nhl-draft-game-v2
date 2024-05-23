import { getContext, setContext } from "svelte";

export class PointsSystem {
  userPoints = $state(0)
  hasOfficialDraftStarted = $state(false)
  officialNhlDraft: Record<number, string> = $state({})

  constructor() {
    this.userPoints = 0
    this.hasOfficialDraftStarted = false
  }

  officialNhlDraftPickMade({ pick, prospect } : {pick: number; prospect: string}) {
    this.officialNhlDraft[pick] = prospect
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