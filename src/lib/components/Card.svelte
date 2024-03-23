<script lang="ts">
  const { children, variant} : {children: any; variant?: string | null} = $props();
</script>

<div class={`border-2 border-black rounded-md shadow-brut-shadow ${variant === 'small' ? 'p-0' : 'p-3'}`}>
  {@render children()}
</div>

<!-- <style lang='postcss'>
  .brut-shadow {
    box-shadow: 4px 4px 0px 0px #000000;
  }
</style> -->

