import type { DraftStateType } from "$lib/global-state/draft-state.svelte";
import type { DraftBoard, User } from "$lib/types";
import toast from "svelte-french-toast";
import type { ProspectDraftSystem } from "$lib/global-state/prospect-state.svelte";


export async function submitDraftBoard({draftboard, user, draftState, draftSystem}: {
  draftboard: DraftBoard[];
  user: User | object
  draftState: DraftStateType;
  draftSystem?: ProspectDraftSystem;
}) {
  // Include undrafted prospect IDs in the payload so API can remove them from DB
  const undraftedProspectIds = draftSystem ? Array.from(draftSystem.undraftedProspectIds) : [];
  
  const draftBoardId = new URLSearchParams(window.location.search).get('board');

  const payload = {
    draftboard,
    user,
    draftBoardId: draftBoardId ? Number(draftBoardId) : undefined,
    undraftedProspectIds // Add this to let the API know which prospects to remove
  };

  try {
    const draft = await fetch('/api/draft', {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'content-type': 'application/json'
      }
    });
    
    const response = await draft.json();
    
    if (response?.message === 'success') {
      // Update draft state
      draftState.updateDraftStatus(true);
      
      // Move temporary drafts to permanent in the prospect system if provided
      if (draftSystem) {
        // Extract prospect IDs from submitted draft board
        const submittedProspectIds: string[] = [];
        for (const draft of draftboard) {
          if (draft.prospect?.id) {
            submittedProspectIds.push(draft.prospect.id);
          }
        }
        
        // Set these as permanently drafted and clear temporary drafts
        draftSystem.setPermanentDrafted(submittedProspectIds);
        draftSystem.clearTemporaryDrafts();
      }
      
      toast.success('Draft submitted successfully', {
        duration: 4000
      });
    } else {
      toast.error('Something went wrong with your draft, please try again', {
        duration: 4000
      })
    }
  } catch (error) {
    // Error submitting draft board - logged on server side
    toast.error('Failed to submit draft', {
      duration: 4000
    });
  }
}
