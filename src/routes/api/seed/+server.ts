import { json } from '@sveltejs/kit';
// import { db } from '$lib/server/db';
// import { drafts } from '$lib/server/db/schema/drafts';
import type { DraftBoard, Prospect } from '$lib/types.js';
// import { generateId } from 'lucia';
import { PointsSystem } from '$lib/globalState/scoringSystem.svelte.js';
import { queryGame } from '$lib/server/db/queries/query-game.js';
// import { getPointsSystem } from '$lib/globalState/scoringSystem.svelte.js';

export async function POST({ request }) {
	const { data } = await request.json();

  const res = await queryGame();

	const {draftboard: dboard, prospects} = data;

  const draftboard: DraftBoard[] = dboard.map((draft: DraftBoard) => {
    return {
      ...draft,
      prospect: null
    }
  })

  const prospectTiers: Prospect[][] = []

  for(let i = 0; i < 40; i++) {    
    const currentRank = +prospects[i].rank;

    if(currentRank === 1){
     Array.isArray(prospectTiers[0]) ? prospectTiers[0].push(prospects[i]) : prospectTiers[0] = [prospects[i]];
    } else if( currentRank > 1 && currentRank <= 4){
      Array.isArray(prospectTiers[1]) ? prospectTiers[1].push(prospects[i]) : prospectTiers[1] = [prospects[i]];
    } else if(currentRank > 4 && currentRank <= 12){
      Array.isArray(prospectTiers[2]) ? prospectTiers[2].push(prospects[i]) : prospectTiers[2] = [prospects[i]];
    } else if(currentRank > 12 && currentRank <= 19){ 
      Array.isArray(prospectTiers[3]) ? prospectTiers[3].push(prospects[i]) : prospectTiers[3] = [prospects[i]];
    } else {
      Array.isArray(prospectTiers[4]) ? prospectTiers[4].push(prospects[i]) : prospectTiers[4] = [prospects[i]];
    }

  }

  function randomIndex(array: unknown[]) {
    return Math.floor(Math.random() * array.length);
  }

  for(let i = 0; i < 1; i++) {
    const tempPTiers = prospectTiers


    const tempDraftBoard = draftboard

    tempDraftBoard.forEach((draftPick: DraftBoard) => {
      // console.log('TOP LEVEL DRAFT PICK: ', draftPick);

      if(draftPick.prospect !== null) return;

      for(let i = 0; i < tempPTiers.length; i++) {
        if(draftPick.prospect !== null) break;
        if(tempPTiers[i].length !== 0) {
          // console.log('CURRENT PROSPECT TIER: ',i, tempPTiers[i]);
          const selectedProspect = tempPTiers[i].splice(randomIndex(tempPTiers[i]), 1)[0];
          // console.log('SELECTED PROSPECT: ', selectedProspect);
          draftPick.prospect = selectedProspect;

          // console.log('DRAFT PICK! ', draftPick);
        }
      }
    })

      // console.log(tempDraftBoard );

      // test to see if point system works

      // const pointSystem = new PointsSystem()

      // console.log('before draft: ',pointSystem.officialNhlDraft);
      
      // tempDraftBoard.forEach(pick => {
      //   pointSystem.officialNhlDraftPickMade({
      //     pick: pick.draftPosition,
      //     prospect: pick.prospect?.name || ''
      //   })
      // })
      
      // console.log('after draft: ', pointSystem.officialNhlDraft);
    }


  // ******************* CREATE USERS AND DRAFTS FOR THEM ***************
	// try {
	// 	draftboard.forEach(async (draft: DraftBoard) => {
	// 		if (!draft.prospect) return;
	
	// 		await db
	// 		.insert(drafts)
	// 		.values({
	// 					userId: fakeUserId,
	// 					positionDrafted: draft.draftPosition,
	// 					prospect: JSON.stringify(draft.prospect)
	// 				})
	// 		.onConflictDoUpdate({
	// 			target: [drafts.positionDrafted, drafts.userId],
	// 			set: { prospect: JSON.stringify(draft.prospect) },
	// 		});
	// 	});
	// } catch (error) {
	// 	console.log(error);
	// }


	return json({ message: 'success' });
}
