<script lang="ts">
	import Card from './Card.svelte';
	
	interface LeaderboardEntry {
		userId: string;
		userName: string;
		userAvatar: string | null;
		score: number;
	}

	let { gameId }: { gameId: string } = $props();
	
	let leaderboard: LeaderboardEntry[] = $state([]);
	let isLoading = $state(true);
	let lastUpdated = $state('');

	async function fetchLeaderboard() {
		try {
			const response = await fetch(`/api/leaderboard?limit=3`);
			const data = await response.json();
			
			if (data.success) {
				leaderboard = data.leaderboard;
				lastUpdated = new Date(data.lastUpdated).toLocaleTimeString();
			}
		} catch (error) {
			console.error('Failed to fetch leaderboard:', error);
		} finally {
			isLoading = false;
		}
	}

	// Fetch leaderboard initially and every 10 seconds
	$effect(() => {
		fetchLeaderboard();
		const interval = setInterval(fetchLeaderboard, 10000);
		
		return () => clearInterval(interval);
	});

	function getRankIcon(index: number) {
		switch (index) {
			case 0: return '🥇';
			case 1: return '🥈';
			case 2: return '🥉';
			default: return `${index + 1}`;
		}
	}
</script>

<div class="text-center pt-4">
	<h2 class="mb-4 text-lg font-bold uppercase tracking-wide">Top Players</h2>
	
	{#if isLoading}
		<div class="flex justify-center items-center py-6">
			<div class="animate-pulse">
				<div class="h-4 bg-gray-300 rounded w-24 mb-2"></div>
				<div class="h-4 bg-gray-300 rounded w-16"></div>
			</div>
		</div>
	{:else if leaderboard.length === 0}
		<Card class="bg-white">
			<p class="text-black py-2 font-bold">No scores yet</p>
		</Card>
	{:else}
		<div class="space-y-3">
			{#each leaderboard as entry, index}
				<Card class="shadow-brut-shadow-sm bg-white">
					<div class="flex items-center gap-4 px-2 py-1">
						<div class="text-2xl w-10 text-center font-bold">
							{getRankIcon(index)}
						</div>
						
						<div class="flex items-center gap-3 flex-1 min-w-0">
							{#if entry.userAvatar}
								<img 
									src={entry.userAvatar} 
									alt={entry.userName}
									class="w-8 h-8 rounded-full border-2 border-black shadow-sm"
								/>
							{/if}
							<span class="font-bold truncate text-lg">{entry.userName}</span>
						</div>
						
						<Card class="bg-primary text-white shadow-brut-shadow-sm">
							<div class="px-3 py-1">
								<span class="font-bold text-xl">{entry.score}</span>
							</div>
						</Card>
					</div>
				</Card>
			{/each}
		</div>
		
		{#if lastUpdated}
			<p class="text-xs text-gray-600 mt-3 font-mono">
				Last updated: {lastUpdated}
			</p>
		{/if}
	{/if}
</div>
