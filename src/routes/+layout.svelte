<script lang="ts">
	import { setDraftBoard } from '$lib/globalState/prospects/draftBoardState.svelte';
	import { setProspects } from '$lib/globalState/prospects/prospectsState.svelte';
	import '../app.pcss';

	let { children, data } = $props();

	const prospectList = setProspects(data.prospects);
	const draftBoard = setDraftBoard(data.draftBoard);
</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>
{@render children()}
