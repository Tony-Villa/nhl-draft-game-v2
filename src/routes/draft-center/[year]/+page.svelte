<script lang="ts">
	import Ladder from '$lib/components/Ladder.svelte';


  let {data} = $props();

</script>
  
<div class="mx-auto h-full max-w-screen-2xl">
  <Ladder ladder={data?.ladder} />
</div>
