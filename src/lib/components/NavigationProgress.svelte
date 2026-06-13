<script lang="ts">
	import { navigating } from '$app/state';

	const isNavigating = $derived(navigating.to !== null);
</script>

<div
	class="pointer-events-none fixed inset-x-0 top-0 z-100 h-1.5 overflow-hidden"
	aria-hidden="true"
	data-navigation-progress={isNavigating ? 'pending' : 'idle'}
>
	{#if isNavigating}
		<div class="navigation-progress-bar bg-primary h-full w-full border-b-2 border-black"></div>
	{/if}
</div>

<div class="sr-only" role="status" aria-live="polite">
	{isNavigating ? 'Loading the next page' : ''}
</div>

<style>
	.navigation-progress-bar {
		transform-origin: left;
		animation: navigation-progress 1.1s ease-in-out infinite;
	}

	@keyframes navigation-progress {
		0% {
			transform: translateX(-70%) scaleX(0.35);
		}
		55% {
			transform: translateX(5%) scaleX(0.72);
		}
		100% {
			transform: translateX(100%) scaleX(0.25);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navigation-progress-bar {
			animation: none;
		}
	}
</style>
