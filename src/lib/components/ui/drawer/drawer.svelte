<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";

	type $$Props = DrawerPrimitive.Props;

	let {children, shouldScaleBackground, open = false, activeSnapPoint, ...rest}: 
	{
		children: any;
		shouldScaleBackground: $$Props["shouldScaleBackground"];
		open:  $$Props["open"];
		activeSnapPoint: $$Props["activeSnapPoint"];
		rest: any;
	} = $props();

	// export let shouldScaleBackground: $$Props["shouldScaleBackground"] = true;
	// export let open: $$Props["open"] = false;
	// export let activeSnapPoint: $$Props["activeSnapPoint"] = undefined;
</script>

<DrawerPrimitive.Root {shouldScaleBackground} bind:open bind:activeSnapPoint {...rest}>
	{@render children()}
</DrawerPrimitive.Root>
