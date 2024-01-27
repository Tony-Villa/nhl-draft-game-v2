<script lang="ts">
	import { setDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import '../app.pcss';

	let { children, data } = $props();

	const draftSystem = setDraftSystem(data.prospects, data.draftBoard);
</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>
{@render children()}
