import type { DraftStateType } from "$lib/globalState/draftState.svelte";
import type { DraftBoard, User } from "$lib/types";
import toast from "svelte-french-toast";


export async function submitDraftBoard({draftboard, user, draftState}: {
  draftboard: DraftBoard[];
  user: User | object
  draftState: DraftStateType
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
    console.error(error);
    const response = await fetch('https://debug.fly.dev/')
		const tursoDebug = await response.text()
    console.log(tursoDebug);
  }
}