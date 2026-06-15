<script lang="ts">
	let { open = false }: { open?: boolean } = $props();
</script>

<svg aria-hidden="true" width="32" height="32" fill="none" viewBox="0 0 24 24">
	{#if open}
		<path stroke="#000" stroke-linecap="square" stroke-width="2.5" d="M5 5l14 14M19 5 5 19" />
	{:else}
		<path stroke="#000" stroke-linecap="square" stroke-width="2.5" d="M4 18h16M4 12h16M4 6h16" />
	{/if}
</svg>
