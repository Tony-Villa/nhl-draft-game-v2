<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import type { Snippet } from 'svelte'

	type $$Props = DrawerPrimitive.Props;

	let {children, shouldScaleBackground = true, open = false, activeSnapPoint = undefined, ...rest}: 
	{
		children: Snippet;
		shouldScaleBackground?: $$Props["shouldScaleBackground"];
		open?: $$Props["open"];
		activeSnapPoint?: $$Props["activeSnapPoint"];
		rest?: any;
	} = $props();

</script>

<DrawerPrimitive.Root {shouldScaleBackground} bind:open bind:activeSnapPoint {...rest}>
	{@render children()}
</DrawerPrimitive.Root>
