<script lang="ts">
  const { children, variant, class: className} : {children: any; variant?: string | null; class?: string;} = $props();
</script>

<div class={`border-2 border-black rounded-md ${variant === 'small' ? 'p-0' : 'p-3'} ${className}`}>
  {@render children()}
</div>

