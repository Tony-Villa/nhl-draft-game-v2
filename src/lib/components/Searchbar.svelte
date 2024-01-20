<script lang="ts">
	export let value: string | undefined = '';
	export let placeholder: string | undefined = '';
</script>

<input type="text" bind:value {placeholder} />
