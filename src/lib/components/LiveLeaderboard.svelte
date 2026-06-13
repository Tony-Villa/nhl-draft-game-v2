<script lang="ts">
	import type { LiveLeaderboardData } from '$lib/leaderboard/types';
	import { getLiveLeaderboardRows } from '$lib/remote/leaderboard.remote';
	import { untrack } from 'svelte';
	import Button from './Button.svelte';
	import Card from './Card.svelte';

	let {
		gameId,
		enabled = true
	}: {
		gameId: string;
		enabled?: boolean;
	} = $props();

	let hasBeenEnabled = $state(untrack(() => enabled));
	const leaderboardQuery = $derived(
		getLiveLeaderboardRows({
			gameId,
			limit: 3
		})
	);

	$effect(() => {
		if (enabled) hasBeenEnabled = true;
	});

	$effect(() => {
		if (!enabled) return;

		const interval = setInterval(() => {
			void leaderboardQuery.refresh();
		}, 10_000);

		return () => clearInterval(interval);
	});

	function refreshLeaderboard() {
		void leaderboardQuery.refresh();
	}

	function retryLeaderboard(reset: () => void) {
		void leaderboardQuery.refresh();
		reset();
	}

	function getRankIcon(index: number) {
		switch (index) {
			case 0:
				return '🥇';
			case 1:
				return '🥈';
			case 2:
				return '🥉';
			default:
				return `${index + 1}`;
		}
	}

	function formatLastUpdated(value: string) {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit',
			timeZone: 'UTC',
			timeZoneName: 'short'
		}).format(new Date(value));
	}
</script>

{#if hasBeenEnabled}
	<div hidden={!enabled} class="pt-4 text-center">
		<h2 class="mb-4 text-lg font-bold tracking-wide uppercase">Top Players</h2>

		<svelte:boundary>
			{@render leaderboardResults(await leaderboardQuery)}

			{#snippet pending()}
				<div class="flex items-center justify-center py-6" data-leaderboard-state="loading">
					<div class="animate-pulse space-y-2">
						<div class="h-4 w-24 rounded bg-gray-300"></div>
						<div class="h-4 w-16 rounded bg-gray-300"></div>
					</div>
				</div>
			{/snippet}

			{#snippet failed(error, reset)}
				<div data-leaderboard-state="error">
					<Card class="bg-white">
						<p class="py-2 font-bold text-black">Unable to load the leaderboard</p>
						<p class="text-sm text-gray-600">Your draft selections have not been changed.</p>
						<Button class="mt-4" onclick={() => retryLeaderboard(reset)}>Try again</Button>
					</Card>
				</div>
			{/snippet}
		</svelte:boundary>
	</div>
{/if}

{#snippet leaderboardResults(data: LiveLeaderboardData)}
	{#if data.leaderboard.length === 0}
		<div data-leaderboard-state="empty">
			<Card class="bg-white">
				<p class="py-2 font-bold text-black">No scores yet</p>
			</Card>
		</div>
	{:else}
		<div class="space-y-3" data-leaderboard-state="populated">
			{#each data.leaderboard as entry, index}
				<Card class="shadow-brut-shadow-sm bg-white">
					<div class="flex items-center gap-4 px-2 py-1">
						<div class="w-10 text-center text-2xl font-bold">
							{getRankIcon(index)}
						</div>

						<div class="flex min-w-0 flex-1 items-center gap-3">
							{#if entry.userAvatar}
								<img
									src={entry.userAvatar}
									alt={entry.userName || 'Leaderboard player'}
									class="h-8 w-8 rounded-full border-2 border-black shadow-sm"
									width="32"
									height="32"
									loading="lazy"
									decoding="async"
								/>
							{/if}
							<span class="truncate text-lg font-bold">{entry.userName || 'Anonymous player'}</span>
						</div>

						<Card class="bg-primary shadow-brut-shadow-sm text-white">
							<div class="px-3 py-1">
								<span class="text-xl font-bold">{entry.score}</span>
							</div>
						</Card>
					</div>
				</Card>
			{/each}
		</div>
	{/if}

	<div class="mt-3 flex flex-col items-center gap-2">
		<p class="font-mono text-xs text-gray-600">
			Last updated: {formatLastUpdated(data.lastUpdated)}
		</p>
		<Button
			variant="outline"
			size="sm"
			disabled={leaderboardQuery.loading}
			onclick={refreshLeaderboard}
		>
			{leaderboardQuery.loading ? 'Refreshing...' : 'Refresh rankings'}
		</Button>
	</div>
{/snippet}
