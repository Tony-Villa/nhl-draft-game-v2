<script lang="ts">
	import Card from "./Card.svelte";

    let {userPick, nhlPick} = $props()
</script>

<div class="flex">
  <Card>
    User Pick
  </Card>

  <Card>
    NHL Pick
  </Card>
</div>
    