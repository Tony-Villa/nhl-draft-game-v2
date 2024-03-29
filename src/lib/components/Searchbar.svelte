<script lang="ts">
	let {
		value,
		placeholder
	}: {
		value: string;
		placeholder?: string;
	} = $props();
</script>



<div class="flex text-black rounded-3xl bg-orange-200 p-2 px-3 gap-1 placeholder:text-slate-500">
	<svg viewBox='0 0 24 24' width="24" height='24' fill='#3f3f46'>
		<path d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"></path>
	</svg>

	<input class="bg-transparent focus:outline-none" type="text" bind:value placeholder={placeholder ? placeholder : ''} />
</div>
