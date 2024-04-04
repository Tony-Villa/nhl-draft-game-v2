<script lang="ts">
	let {
		value,
		placeholder
	}: {
		value: string;
		placeholder?: string;
	} = $props();

	let isFocused = $state(false);

</script>



<div class={`flex text-black rounded-xl shadow-brut-shadow p-2 px-3 gap-1 lg:w-auto xl:w-[400px] ${isFocused ? 'bg-cyan-300' : 'bg-cyan-200'}`}>
	<svg viewBox='0 0 24 24' width="24" height='24' fill='#3f3f46'>
		<path d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"></path>
	</svg>

	<input class=" flex-grow bg-transparent focus:outline-none placeholder-gray-950" type="text" bind:value on:focus={() => isFocused = true} on:blur={() => isFocused = false} placeholder={placeholder ? placeholder : ''} />

	<div class="justify-self-end border-2 border-black rounded-full px-2">
		<button on:click={() => value = ''}>
			<p class='font-bold'>X</p>
		</button>
	</div>
</div>
