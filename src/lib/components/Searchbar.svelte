<script lang="ts">
	let { value, placeholder } = $props<{
		value: string;
		placeholder: string;
	}>();
</script>

<input class="text-black" type="text" bind:value placeholder={placeholder ? placeholder : ''} />
