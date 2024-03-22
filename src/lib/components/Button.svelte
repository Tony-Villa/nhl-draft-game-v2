<script lang="ts">

 type Variant = 'primary' | 'secondary';

  interface ButtonProps {
    children: any;
    variant?: Variant;
  }

	const { children, variant = 'primary' }: ButtonProps = $props();
</script>

<button on:click class={`border-2 border-b-4 border-r-4 rounded-md border-solid border-gray-900 px-3 py-1 relative  ${variant === 'primary' ? 'bg-yellow-400 font-semibold' : variant === 'secondary' ? 'bg-orange-100' : ''} `}>
  <!-- {#if variant === 'primary'}
  <div class="absolute h-full w-full bg-yellow-400 top-1 left-1  rounded z-0" />
  {/if} -->
    {@render children()}
</button>