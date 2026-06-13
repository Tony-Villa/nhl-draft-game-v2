import type { DraftStateType } from '$lib/global-state/draft-state.svelte';
import type { ProspectDraftSystem } from '$lib/global-state/prospect-state.svelte';
import { submitDraftBoardCommand } from '$lib/remote/drafts.remote';
import type { DraftBoard } from '$lib/types';
import toast from 'svelte-french-toast';

export async function submitDraftBoard({
	draftboard,
	draftState,
	draftSystem
}: {
	draftboard: DraftBoard[];
	draftState: DraftStateType;
	draftSystem?: ProspectDraftSystem;
}) {
	const draftBoardId = new URLSearchParams(window.location.search).get('board');

	try {
		const result = await submitDraftBoardCommand({
			draftBoardId: draftBoardId ? Number(draftBoardId) : undefined,
			picks: draftboard
				.filter((draft) => draft.teamName)
				.map((draft) => ({
					draftPosition: draft.draftPosition,
					team: draft.teamName as string,
					prospectId: draft.prospect?.id || null
				}))
		});

		draftState.updateDraftStatus(true);

		if (draftSystem) {
			draftSystem.setPermanentDrafted(result.submittedProspectIds);
			draftSystem.clearTemporaryDrafts();
		}

		toast.success('Draft submitted successfully', {
			duration: 4000
		});

		return { success: true as const };
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'Failed to submit draft';

		toast.error(message, {
			duration: 4000
		});

		return {
			success: false as const,
			error: message
		};
	}
}
