<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { fade } from 'svelte/transition';
	import Card from './Card.svelte';
	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { compareString } from '$lib/helpers/compare-strings';
	import { untrack } from 'svelte';

	const draftSystem = getDraftSystem();
	const draftState = getDraftState();

	let { currentPick, isMockGame = false }: { currentPick: number; isMockGame?: boolean } = $props();

	let currentDraftPosition = $state(untrack(() => currentPick));
	let currentStyle = $state('waiting');
	let userCurrentPick = $derived(
		draftSystem?.draftBoard[currentDraftPosition]?.prospect?.name || 'No pick'
	);
	let NhlCurrentPick = $derived(
		draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name || ' '
	);

	// Sync with parent's currentPick prop when it changes
	$effect(() => {
		if (isMockGame) {
			currentDraftPosition = currentPick;
		} else if (currentPick > currentDraftPosition) {
			currentDraftPosition = currentPick;
		}
	});

	$effect(() => {
		if (draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name) {
			let totalPoints = draftSystem.computePoints();

			const timeout = setTimeout(() => {
				if (!isMockGame) {
					// Advance to the next pick position, but don't exceed the draft length
					const nextPosition = Math.min(currentDraftPosition + 1, 31);
					currentDraftPosition = nextPosition;
				}
			}, 5000);

			return () => {
				clearTimeout(timeout);
			};
		}
	});

	// $inspect('Current draft position', currentDraftPosition)
	// $inspect('Current user draft pick: ', draftSystem.draftBoard[currentDraftPosition])
	// $inspect('Current style: ', currentStyle)
	// $inspect('NHL DRAFT BOARD: ', draftSystem?.nhlDraftBoard)

	const cardStyles = `min-w-72 max-w-80 shadow-brut-shadow`;

	$effect(() => {
		if (!draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name) {
			currentStyle = 'waiting';
		} else {
			currentStyle = compareString(userCurrentPick, NhlCurrentPick) ? 'win' : 'lose';
		}
	});
</script>

<div class="my-6 flex flex-col items-center justify-center gap-6 sm:flex-row">
	<!-- User Pick Card -->
	<Card class={`${cardStyles} bg-white`}>
		<div class="text-center">
			<div class="relative">
				<h3 class="relative mb-3 inline-block text-sm font-bold tracking-wide uppercase">
					Your Pick
					<span class="bg-primary absolute bottom-0 left-0 h-1 w-full"></span>
				</h3>
			</div>

			<!-- Fixed height container to match NHL card -->
			<div class="mb-3 flex min-h-12 items-center justify-between gap-4">
				<!-- Left side - Number and Logo -->
				<div class="flex items-center gap-3">
					<span class="text-2xl font-bold">#{currentDraftPosition + 1}</span>
					<img
						class="h-12 w-12"
						src={draftSystem?.draftBoard[currentDraftPosition]?.teamLogo}
						alt=""
					/>
				</div>

				<!-- Right side - Empty space to match NHL card structure -->
				<div class="h-8 w-15"></div>
			</div>

			<Card class="shadow-brut-shadow-sm bg-white">
				<p class="px-3 py-2 text-lg font-bold">{userCurrentPick}</p>
			</Card>
		</div>
	</Card>

	<!-- VS Divider -->
	<div class="hidden text-3xl font-bold text-gray-400 sm:block">VS</div>

	<!-- NHL Pick Card -->
	<Card
		class={`${cardStyles} ${
			currentStyle === 'waiting'
				? 'animate-pulse bg-white'
				: currentStyle === 'win'
					? 'bg-green-500'
					: 'bg-red-500'
		}`}
	>
		<div class="text-center">
			<div class="relative">
				<h3
					class={`relative mb-3 inline-block text-sm font-bold tracking-wide uppercase ${
						currentStyle === 'waiting' ? 'text-black' : 'text-white'
					}`}
				>
					NHL Pick
					<span class="bg-primary absolute bottom-0 left-0 h-1 w-full"></span>
				</h3>
			</div>

			<!-- Fixed height container to prevent layout shift -->
			<div class="mb-3 flex min-h-[48px] items-center justify-between gap-4">
				<!-- Left side - Number and Logo -->
				<div class="flex items-center gap-3">
					<span
						class={`text-2xl font-bold ${currentStyle === 'waiting' ? 'text-black' : 'text-white'}`}
						>#{currentDraftPosition + 1}</span
					>
					<img
						class="h-12 w-12"
						src={draftSystem?.draftBoard[currentDraftPosition]?.teamLogo}
						alt=""
					/>
				</div>
				<!-- Right side - Status Badge (fixed position) -->
				<div class="flex h-8 w-15 items-center justify-center">
					{#if currentStyle === 'win'}
						<div class="rounded-md border-2 border-black bg-green-700 px-2 py-1 text-white">
							<span class="text-xs font-bold">MATCH</span>
						</div>
					{:else if currentStyle === 'lose'}
						<div class="rounded-md border-2 border-black bg-red-700 px-2 py-1 text-white">
							<span class="text-xs font-bold">MISS</span>
						</div>
					{/if}
				</div>
			</div>

			<Card class="shadow-brut-shadow-sm bg-white">
				<p class="px-3 py-2 text-lg font-bold text-black">
					{currentStyle === 'waiting' ? '...' : NhlCurrentPick}
				</p>
			</Card>
		</div>
	</Card>
</div>
