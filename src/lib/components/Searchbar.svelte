<script lang="ts">
	import Close from '$lib/icons/Close.svelte';
	import type { Binding } from 'svelte';

	let {
		value = $bindable(''),
		placeholder
	}: {
		value: string;
		placeholder?: string;
	} = $props();

	let isFocused = $state(false);
</script>

<div
	class={`flex gap-1 rounded-xl border-2 border-black p-2 px-3 text-black shadow-brut-shadow-sm lg:w-auto xl:w-[400px] ${isFocused ? 'bg-orange-100' : 'bg-orange-50'}`}
>
	<svg viewBox="0 0 24 24" width="24" height="24" fill="#3f3f46">
		<path
			d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
		></path>
	</svg>

	<input
		class="flex-grow bg-transparent placeholder-gray-950 focus:outline-none"
		type="text"
		bind:value
		onfocus={() => (isFocused = true)}
		onblur={() => (isFocused = false)}
		placeholder={placeholder ? placeholder : ''}
	/>

	{#if value.length}
		<button onclick={() => (value = '')}>
			<Close size={24} />
		</button>
	{/if}
</div>