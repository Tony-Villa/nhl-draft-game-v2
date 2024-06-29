import type { DraftBoard } from "$lib/types";

export function computePoints(user, nhl) {
  let startingPoints = 10;
  let tempProspectCompare: Record<string,Record<string,number>> = {}
  let userId = user[0]?.userId

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

    // console.log('inside nhl loop: ', nhl[i]);
    
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
      user[i].points = startingPoints - Math.abs(tempProspectCompare[user[i].prospect?.name as string]?.user - tempProspectCompare[user[i].prospect?.name as string]?.nhl) < 0 ? 0 : startingPoints - Math.abs(tempProspectCompare[user[i].prospect?.name as string]?.user - tempProspectCompare[user[i].prospect?.name as string]?.nhl)
    }
  }

  // console.log(tempProspectCompare);

  
  return {
    userId,
    score: user.reduce((acc,d) => acc + (d.points || 0), 0)
  }
  
}