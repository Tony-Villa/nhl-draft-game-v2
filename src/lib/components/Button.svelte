<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { buttonOptions, type ButtonProps } from './Button.options';

	const {
		children,
		disabled = false,
		variant = 'primary',
		size = 'md',
		skew = 'none',
		shadow = 'md',
		class: className,
		id,
		ariaPressed,
		onclick
	}: ButtonProps = $props();
</script>

<button
	{disabled}
	{id}
	aria-pressed={ariaPressed}
	{onclick}
	class={`${twMerge(buttonOptions({ variant, size, shadow, skew }), className)}`}
>
	{@render children()}
</button>
