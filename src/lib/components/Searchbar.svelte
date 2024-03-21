<script lang="ts">
	let {
		value,
		placeholder
	}: {
		value: string;
		placeholder?: string;
	} = $props();
</script>

<input class="text-black" type="text" bind:value placeholder={placeholder ? placeholder : ''} />
