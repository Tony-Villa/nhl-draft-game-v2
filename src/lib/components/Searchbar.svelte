<script lang="ts">
	let { value, placeholder } = $props();
</script>

<input type="text" bind:value placeholder={placeholder ? placeholder : ''} />
