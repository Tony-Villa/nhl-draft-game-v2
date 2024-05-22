import type { DraftBoard, Prospect } from "$lib/types";
import toast from "svelte-french-toast";

export async function seedDb({prospects, draftboard}: {
  prospects: Prospect[];
  draftboard: DraftBoard[]
}) {
  const payload = {
    prospects,
    draftboard
  }

  try {
    const response = await fetch('/api/seed', {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'content-type': 'application/json'
      }
    });

    if (response) {
      toast.success('Database seeded successfully', {
        duration: 4000
      });
    }
  } catch (error) {
    console.log(error);
  }
}