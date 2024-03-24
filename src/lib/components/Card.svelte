<script lang="ts">
  const { children, variant, class: classname} : {children: any; variant?: string | null; class?: string;} = $props();
</script>

<div class={`border-2 border-black rounded-md ${variant === 'small' ? 'p-0' : 'p-3'} ${classname}`}>
  {@render children()}
</div>

