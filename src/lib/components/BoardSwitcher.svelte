<script lang="ts">
	import { Check, ChevronDown, LayoutTemplate, Settings } from '@lucide/svelte';

	type BoardSummary = {
		id: number;
		name: string;
		status: string;
	};

	let {
		selectedBoard,
		boards = [],
		canSwitch = false
	}: {
		selectedBoard: BoardSummary | null;
		boards: BoardSummary[];
		canSwitch?: boolean;
	} = $props();
</script>

{#if selectedBoard}
	<details class="group relative min-w-0">
		<summary
			class="flex min-h-10 max-w-full cursor-pointer list-none items-center gap-2 border-[3px] border-black bg-white px-3 py-2 font-bold shadow-button-sm transition-all duration-100 hover:bg-accent group-open:translate-x-[2px] group-open:translate-y-[2px] group-open:shadow-none [&::-webkit-details-marker]:hidden"
		>
			<LayoutTemplate class="size-4 shrink-0" aria-hidden="true" />
			<span class="shrink-0 text-xs uppercase text-gray-600">Board:</span>
			<span class="truncate text-sm uppercase">{selectedBoard.name}</span>
			<ChevronDown
				class="size-4 shrink-0 transition-transform duration-100 group-open:rotate-180"
				aria-hidden="true"
			/>
		</summary>

		<div
			class="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] border-[3px] border-black bg-white shadow-button-shadow sm:left-auto sm:right-0"
		>
			<div class="border-b-[3px] border-black px-3 py-2">
				<p class="text-xs font-black uppercase text-gray-600">
					{canSwitch ? 'Switch draft board' : 'Current draft board'}
				</p>
			</div>

			{#if canSwitch}
				{#each boards as board}
					<a
						href={`/draft-center?board=${board.id}`}
						data-sveltekit-reload
						aria-current={board.id === selectedBoard.id ? 'page' : undefined}
						class="flex min-h-11 items-center gap-3 border-b border-black px-3 py-2 font-bold hover:bg-accent"
					>
						<span class="flex size-4 shrink-0 items-center justify-center">
							{#if board.id === selectedBoard.id}
								<Check class="size-4" strokeWidth={4} aria-hidden="true" />
							{/if}
						</span>
						<span class="min-w-0 flex-1 truncate">{board.name}</span>
						<span class="text-xs uppercase text-gray-600">{board.status}</span>
					</a>
				{/each}
			{:else}
				<div class="border-b border-black px-3 py-3 text-sm font-bold text-gray-600">
					Board selection is locked.
				</div>
			{/if}

			<a
				href="/draft-center/boards"
				class="flex min-h-11 items-center gap-3 bg-white px-3 py-2 text-sm font-black uppercase hover:bg-primary"
			>
				<Settings class="size-4" aria-hidden="true" />
				Manage boards
			</a>
		</div>
	</details>
{/if}
