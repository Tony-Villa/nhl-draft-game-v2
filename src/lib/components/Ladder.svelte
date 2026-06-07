<script lang="ts">
	import { ordinalNumbers } from '$lib/helpers/ordinal-numbers';
	import type { LadderEntry } from '$lib/leaderboard/types';
	import { getLadderRows } from '$lib/remote/leaderboard.remote';
	import { twMerge } from 'tailwind-merge';
	import { ladderOptions, ladderTextOptions } from './Ladder.options';
	import Button from './Button.svelte';
	import Card from './Card.svelte';
	import StanleyCup from '$lib/icons/StanleyCup.svelte';

	let {
		year,
		enabled = true
	}: {
		year: number;
		enabled?: boolean;
	} = $props();

	const ladderQuery = $derived(getLadderRows({ year }));

	function refreshLadder() {
		void ladderQuery.refresh();
	}

	function retryLadder(reset: () => void) {
		void ladderQuery.refresh();
		reset();
	}

	function playerName(player: LadderEntry) {
		return player.playerName || 'Anonymous player';
	}
</script>

{#if enabled}
	<svelte:boundary>
		{@render ladderResults(await ladderQuery)}

		{#snippet pending()}
			<div class="my-10 flex w-full justify-center" data-ladder-state="loading">
				<Card class="mx-4 w-full max-w-md bg-white text-center">
					<div class="animate-pulse space-y-3">
						<div class="mx-auto h-7 w-52 rounded bg-gray-300"></div>
						<div class="mx-auto h-4 w-64 rounded bg-gray-200"></div>
					</div>
				</Card>
			</div>
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="my-10 flex w-full justify-center" data-ladder-state="error">
				<Card class="mx-4 w-full max-w-md bg-white text-center">
					<h1 class={ladderTextOptions({ type: 'title', class: 'text-xl sm:text-2xl' })}>
						Unable to load final standings
					</h1>
					<p class="mt-3 text-sm font-bold uppercase">
						Your draft selections have not been changed.
					</p>
					<Button class="mt-4" onclick={() => retryLadder(reset)}>Try again</Button>
				</Card>
			</div>
		{/snippet}
	</svelte:boundary>
{/if}

{#snippet ladderResults(ladder: LadderEntry[])}
	{#if ladder.length === 0}
		<div class="my-10 flex w-full justify-center" data-ladder-state="empty">
			<Card class="mx-4 w-full max-w-md bg-white text-center">
				<h1 class={ladderTextOptions({ type: 'title', class: 'text-xl sm:text-2xl' })}>
					No final scores yet
				</h1>
				<p class="mt-3 text-sm font-bold uppercase">
					Scores will appear here once they are available.
				</p>
				<Button
					class="mt-4"
					variant="outline"
					disabled={ladderQuery.loading}
					onclick={refreshLadder}
				>
					{ladderQuery.loading ? 'Refreshing...' : 'Refresh standings'}
				</Button>
			</Card>
		</div>
	{:else}
		<div data-ladder-state="populated">
			<div class="z-0 mt-10 mb-6 flex w-full justify-center sm:mb-8">
				<Card
					class={twMerge(
						ladderOptions({ variant: 'player', position: 'first' }),
						'mx-4 flex min-h-52 w-full max-w-xs flex-col justify-center sm:mx-auto sm:max-w-md'
					)}
				>
					<div class="absolute -top-8 -right-4 z-10 rotate-[-16deg] sm:-top-10 sm:-right-6">
						<div class="sm:hidden">
							<StanleyCup size={90} color="#ffd700" />
						</div>
						<div class="hidden sm:block">
							<StanleyCup size={100} color="#ffd700" />
						</div>
					</div>

					<h1
						class={ladderTextOptions({
							type: 'title',
							class: 'text-center text-xl sm:text-2xl'
						})}
					>
						{playerName(ladder[0])}
					</h1>

					<div class={ladderOptions({ variant: 'score', size: 'md' })}>
						<h3
							class={ladderTextOptions({
								type: 'score',
								class: 'text-center text-4xl sm:text-6xl'
							})}
						>
							{ladder[0].score}
						</h3>
					</div>
				</Card>
			</div>

			{#if ladder.length > 1}
				<div
					class="runners-up mx-4 mb-6 flex flex-col items-center justify-center gap-4 sm:mb-8 sm:flex-row sm:gap-6"
				>
					{#each ladder.slice(1, 3) as player, index}
						<Card
							class={twMerge(
								ladderOptions({ variant: 'player', position: 'first' }),
								'w-full max-w-[280px] sm:w-auto sm:max-w-[220px] sm:min-w-[200px]'
							)}
						>
							<div class="absolute -top-5 -right-4 z-10 rotate-[-16deg] sm:-top-7 sm:-right-6">
								<div class="sm:hidden">
									<StanleyCup size={70} color={index === 0 ? '#c0c0c0' : '#cd7f32'} />
								</div>
								<div class="hidden sm:block">
									<StanleyCup size={80} color={index === 0 ? '#c0c0c0' : '#cd7f32'} />
								</div>
							</div>

							<div class="mb-3 flex flex-col gap-2">
								<div class="relative">
									<div class="bg-primary absolute top-6 left-2 h-[3px] w-1/4"></div>
									<h1
										class={ladderTextOptions({
											type: 'rank',
											class: 'text-base sm:text-lg'
										})}
									>
										{ordinalNumbers(index + 2)}
									</h1>
								</div>
								<h1
									class={ladderTextOptions({
										type: 'title',
										class: 'mb-2 text-center text-base sm:text-lg'
									})}
								>
									{playerName(player)}
								</h1>
							</div>

							<div class={ladderOptions({ variant: 'score', size: 'sm' })}>
								<h3
									class={ladderTextOptions({
										type: 'score',
										class: 'text-center text-2xl sm:text-3xl'
									})}
								>
									{player.score}
								</h3>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			{#if ladder.length > 3}
				<div class="mx-4 mb-5 flex flex-wrap justify-center gap-4 sm:mx-6">
					{#each ladder.slice(3) as player, index}
						{#if player.score > 0}
							<Card
								class={twMerge(
									ladderOptions({ variant: 'player', size: 'sm' }),
									'w-full max-w-44 sm:max-w-48'
								)}
							>
								<div class="mb-2 flex flex-col gap-1">
									<div class="relative">
										<div class="bg-primary absolute top-4 left-1 h-[2px] w-1/4"></div>
										<h1 class={ladderTextOptions({ type: 'rank', class: 'text-sm' })}>
											{ordinalNumbers(index + 4)}
										</h1>
									</div>
									<h1
										class={ladderTextOptions({
											type: 'name',
											class: 'text-xs sm:text-sm'
										})}
									>
										{playerName(player)}
									</h1>
								</div>

								<div class={ladderOptions({ variant: 'score', size: 'sm' })}>
									<h3
										class={ladderTextOptions({
											type: 'scoreSmall',
											class: 'text-lg sm:text-xl'
										})}
									>
										{player.score}
									</h3>
								</div>
							</Card>
						{/if}
					{/each}
				</div>
			{/if}

			<div class="mb-8 flex justify-center">
				<Button variant="outline" disabled={ladderQuery.loading} onclick={refreshLadder}>
					{ladderQuery.loading ? 'Refreshing...' : 'Refresh standings'}
				</Button>
			</div>
		</div>
	{/if}
{/snippet}
