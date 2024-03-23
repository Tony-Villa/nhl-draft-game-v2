<script lang="ts">
  const { children, variant} : {children: any; variant?: string | null} = $props();
</script>

<div class={`border-2 border-black rounded-md ${variant === 'small' ? 'p-0' : 'p-3'}`}>
  {@render children()}
</div>

