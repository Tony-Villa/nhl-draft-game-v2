<script lang="ts">
	import type { BoardSummary } from '$lib/boards/types';
	import { getBoardSummaries } from '$lib/remote/boards.remote';
	import { Check, ChevronDown, LayoutTemplate, Settings } from '@lucide/svelte';

	let {
		selectedBoard,
		gameId,
		canSwitch = false
	}: {
		selectedBoard: BoardSummary | null;
		gameId: string;
		canSwitch?: boolean;
	} = $props();

	let boardsRequested = $state(false);
	const boardsQuery = $derived(getBoardSummaries({ gameId }));

	function handleToggle(event: Event) {
		boardsRequested ||= (event.currentTarget as HTMLDetailsElement).open;
	}

	function retryBoards(reset: () => void) {
		void boardsQuery.refresh();
		reset();
	}
</script>

{#if selectedBoard}
	<details ontoggle={handleToggle} class="group relative min-w-0">
		<summary
			class="shadow-button-sm hover:bg-accent flex min-h-10 max-w-full cursor-pointer list-none items-center gap-2 border-[3px] border-black bg-white px-3 py-2 font-bold transition-all duration-100 group-open:translate-x-[2px] group-open:translate-y-[2px] group-open:shadow-none [&::-webkit-details-marker]:hidden"
		>
			<LayoutTemplate class="size-4 shrink-0" aria-hidden="true" />
			<span class="shrink-0 text-xs text-gray-600 uppercase">Board:</span>
			<span class="truncate text-sm uppercase">{selectedBoard.name}</span>
			<ChevronDown
				class="size-4 shrink-0 transition-transform duration-100 group-open:rotate-180"
				aria-hidden="true"
			/>
		</summary>

		<div
			class="shadow-button-shadow absolute top-full left-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] border-[3px] border-black bg-white sm:right-0 sm:left-auto"
		>
			<div class="border-b-[3px] border-black px-3 py-2">
				<p class="text-xs font-black text-gray-600 uppercase">
					{canSwitch ? 'Switch draft board' : 'Current draft board'}
				</p>
			</div>

			{#if canSwitch && boardsRequested}
				<svelte:boundary>
					{@render boardOptions(await boardsQuery)}

					{#snippet pending()}
						<div
							class="space-y-2 border-b border-black px-3 py-3"
							data-board-switcher-state="loading"
						>
							<div class="h-4 w-40 animate-pulse rounded bg-gray-300"></div>
							<div class="h-4 w-28 animate-pulse rounded bg-gray-200"></div>
						</div>
					{/snippet}

					{#snippet failed(error, reset)}
						<div class="border-b border-black px-3 py-3" data-board-switcher-state="error">
							<p class="text-sm font-bold">Unable to load your boards.</p>
							<p class="mt-1 text-xs text-gray-600">Your current board has not changed.</p>
							<button
								type="button"
								class="mt-2 text-xs font-black uppercase underline"
								onclick={() => retryBoards(reset)}
							>
								Try again
							</button>
						</div>
					{/snippet}
				</svelte:boundary>
			{:else}
				<div class="border-b border-black px-3 py-3 text-sm font-bold text-gray-600">
					Board selection is locked.
				</div>
			{/if}

			<a
				href="/draft-center/boards"
				class="hover:bg-primary flex min-h-11 items-center gap-3 bg-white px-3 py-2 text-sm font-black uppercase"
			>
				<Settings class="size-4" aria-hidden="true" />
				Manage boards
			</a>
		</div>
	</details>
{/if}

{#snippet boardOptions(boards: BoardSummary[])}
	{#if boards.length === 0}
		<div
			class="border-b border-black px-3 py-3 text-sm font-bold text-gray-600"
			data-board-switcher-state="empty"
		>
			No draft boards are available.
		</div>
	{:else}
		<div data-board-switcher-state="populated">
			{#each boards as board}
				<a
					href={`/draft-center?board=${board.id}`}
					aria-current={board.id === selectedBoard?.id ? 'page' : undefined}
					class="hover:bg-accent flex min-h-11 items-center gap-3 border-b border-black px-3 py-2 font-bold"
				>
					<span class="flex size-4 shrink-0 items-center justify-center">
						{#if board.id === selectedBoard?.id}
							<Check class="size-4" strokeWidth={4} aria-hidden="true" />
						{/if}
					</span>
					<span class="min-w-0 flex-1 truncate">{board.name}</span>
					<span class="text-xs text-gray-600 uppercase">{board.status}</span>
				</a>
			{/each}
		</div>
	{/if}
{/snippet}
