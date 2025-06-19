interface Prospect {
  name: string;
}

interface DraftPick {
  userId?: string;
  prospect?: Prospect;
  positionDrafted: number;
  points?: number;
}

interface NHLDraftPick {
  prospect: string;
  positionDrafted: number;
}

interface ProspectComparison {
  user?: number;
  nhl?: number;
}

interface ComputePointsResult {
  userId: string;
  score: number;
}

export function computePoints(user: DraftPick[], nhl: NHLDraftPick[]): ComputePointsResult | undefined {
  let startingPoints: number = 10;
  let tempProspectCompare: Record<string, ProspectComparison> = {}
  let userId: string | undefined = user[0]?.userId

  if(!userId){
    return;
  }

  for(let i = 0; i < user.length; i++) {
    if(!user[i].prospect) {
      continue
    }

    
    if(user[i]?.prospect?.name) {
      tempProspectCompare[user[i].prospect?.name as string] = {...tempProspectCompare[user[i].prospect?.name as string], user: user[i].positionDrafted }
    }
  }
  
  for(let i = 0; i < nhl.length; i++) {
    if(!nhl[i].prospect) {
      continue
    } 

    if(nhl[i].prospect) {
      tempProspectCompare[nhl[i].prospect as string] = {...tempProspectCompare[nhl[i].prospect as string], nhl: nhl[i].positionDrafted }
    }
  }

  for(let i = 0; i < user.length; i++) {
    if(!user[i].prospect) {
      user[i].points = 0
      continue;	
    } 

    if(user[i].prospect?.name && tempProspectCompare?.[user[i].prospect?.name as string]) {
      // this is dumb ass code but it works, fix it later
      user[i].points = startingPoints - Math.abs(tempProspectCompare[user[i].prospect?.name as string]?.user! - tempProspectCompare[user[i].prospect?.name as string]?.nhl!) < 0 ? 0 : startingPoints - Math.abs(tempProspectCompare[user[i].prospect?.name as string]?.user! - tempProspectCompare[user[i].prospect?.name as string]?.nhl!)
    }
  }

  return {
    userId,
    score: user.reduce((acc: number, d: DraftPick) => acc + (d.points || 0), 0)
  }
  
}