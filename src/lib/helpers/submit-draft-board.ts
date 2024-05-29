import type { DraftStateType } from "$lib/globalState/draftState.svelte";
import type { DraftBoard, User } from "$lib/types";
import toast from "svelte-french-toast";


export async function submitDraftBoard({draftboard, user, draftState}: {
  draftboard: DraftBoard[];
  user: User | object
  draftState: any
}) {
  const payload = {
    draftboard,
    user
  };

  try {
    const draft = await fetch('/api/draft', {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'content-type': 'application/json'
      }
    });
    
    draftState.updateDraftStatus(true);
    
    const response = await draft.json();

    if (response) {
      toast.success('Draft submitted successfully', {
        duration: 4000
      });
    }
  } catch (error) {
    console.log(error);
  }
}