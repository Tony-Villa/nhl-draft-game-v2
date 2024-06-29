<script lang="ts">
	import { ordinalNumbers } from "$lib/helpers/ordinal-numbers";
	import Crown from "$lib/icons/crown.svelte";

    
  interface Ladder {
    id: string;
    score: number;
    playerName: string;
    avarar: string;
  }

  let {ladder}: {ladder: Ladder[]} = $props()

</script>
    


<div class="border-black border-2 rounded-xl shadow-brut-shadow max-w-fit px-4 py-2 bg-orange-100 mx-auto mb-6 mt-10 relative z-10">
    
  <div class="absolute z-0 -right-8 -top-12 rotate-[16deg]">
    <!-- <h3 class=" text-center text-gray-500 text-5xl font-black uppercase drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)] " >Winner</h3> -->

    <Crown size={75} color=#ea580c />
  </div>

  <div class="absolute z-0 -left-12 top-2 ">
    <h3 class=" text-center text-gray-500 text-9xl font-black uppercase opacity-60 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)]" >{1}</h3>
  </div>

    <h1 class="mb-4 text-center text-2xl font-bold uppercase" >{ladder[0].playerName}</h1>

    <div class="flex gap-2 justify-center font-bold border-black border-2 bg-blue-200 rounded-md p-4">
      <h3 class=" text-center text-6xl font-bold uppercase" >{ladder[0].score}</h3>
    </div>

  </div>

<div class="flex flex-wrap gap-5 sm:justify-center sm:mx-5 mb-10">
  {#each ladder as player, i}
    {#if player.score > 0}
      <div class={`border-black border-2 rounded-xl shadow-brut-shadow max-w-fit px-4 py-2 bg-orange-100 mb-1 relative`}>
  
        <!-- <div class={`absolute z-0 ${i+2 <= 9 ? '-left-10' : '-left-20'} top-0`}>
          <h3 class=" text-center tracking-tighter text-gray-500 text-8xl font-black uppercase opacity-60 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)]" >{i+2}</h3>
        </div> -->
  
        <div class="flex gap-2 items-center">
          <h1 class="mb-1 text-center sm:text-lg text-sm font-extrabold">{ordinalNumbers(i+2)}</h1>
          <h1 class="mb-1 text-center sm:text-sm text-xs font-bold uppercase">{player.playerName}</h1>
        </div>
  
        <div class="flex gap-2 justify-center font-bold border-black border-2 bg-blue-200 rounded-md p-4">
          <h3 class=" text-center sm:text-2xl text-md font-bold uppercase">{player.score}</h3>
        </div>
  
      </div>
    {/if}
  {/each}
</div>