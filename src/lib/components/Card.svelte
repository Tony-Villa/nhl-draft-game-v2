<script lang="ts">
	import { twMerge } from 'tailwind-merge';
  import { cardOptions, type CardProps } from './Card.options'


  const { children, size, class: className} : CardProps = $props();
</script>

<div class={`${twMerge(cardOptions({size}), className)}`}>
  {@render children()}
</div>

