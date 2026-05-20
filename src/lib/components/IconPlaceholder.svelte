<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		name = 'icon',
		label,
		class: className,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & {
		name?: string;
		label?: string;
	} = $props();

	const glyphs: Record<string, string> = {
		'arrow-down': '↓',
		'arrow-up': '↑',
		check: '✓',
		'chevron-down': '⌄',
		'chevron-left': '‹',
		'chevron-right': '›',
		'chevron-up': '⌃',
		circle: '•',
		ellipsis: '…',
		minus: '−',
		moon: '◐',
		sun: '☼',
		x: '×'
	};

	let glyph = $derived(glyphs[name] ?? '?');
	let title = $derived(label ?? `${name} placeholder icon`);
</script>

<span
	aria-hidden={label ? undefined : 'true'}
	aria-label={label}
	title={title}
	class={cn(
		'inline-flex shrink-0 items-center justify-center leading-none font-bold not-italic',
		className
	)}
	{...restProps}
>
	{glyph}
</span>
