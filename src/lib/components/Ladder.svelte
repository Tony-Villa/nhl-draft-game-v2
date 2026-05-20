<script lang="ts">
	import { ordinalNumbers } from "$lib/helpers/ordinal-numbers";
	import Crown from "$lib/icons/crown.svelte";
	import { twMerge } from 'tailwind-merge';
	import { ladderOptions, ladderTextOptions, type LadderProps } from './Ladder.options';
	import Card from './Card.svelte';
	import StanleyCup from "$lib/icons/StanleyCup.svelte";

    
  interface Ladder {
    id: string;
    score: number;
    playerName: string;
    avarar: string;
  }

  let {ladder = []}: {ladder: Ladder[]} = $props()

</script>
    
{#if ladder.length < 3}
  <div class="w-full flex justify-center my-10">
    <Card class="w-full max-w-md mx-4 bg-white text-center">
      <h1 class={ladderTextOptions({type: 'title', class: 'text-xl sm:text-2xl'})}>Leaderboard loading</h1>
      <p class="mt-3 text-sm font-bold uppercase">Scores will appear here once they are available.</p>
    </Card>
  </div>
{:else}


<!-- Winner Card - 1st Place -->
<div class="w-full flex justify-center mb-6 sm:mb-8 mt-10 z-0">
  <Card class={twMerge(ladderOptions({variant: 'player', position: 'first'}), 'flex flex-col justify-center w-full min-h-52 max-w-xs sm:max-w-md mx-4 sm:mx-auto')}>
    <!-- Crown Icon -->
    <div class="absolute z-10 -right-4 sm:-right-6 -top-8 sm:-top-10 rotate-[-16deg]">
      <div class="sm:hidden">
        <StanleyCup size={90} color="#ffd700" />
      </div>
      <div class="hidden sm:block">
        <StanleyCup size={100} color="#ffd700" />
      </div>
    </div>

    <!-- Winner Name -->
    <h1 class={ladderTextOptions({type: 'title', class: 'text-center text-xl sm:text-2xl'})}>{ladder[0].playerName}</h1>

    <!-- Winner Score -->
    <div class={ladderOptions({variant: 'score', size: 'md'})}>
      <h3 class={ladderTextOptions({type: 'score', class: 'text-center text-4xl sm:text-6xl'})}>{ladder[0].score}</h3>
    </div>
  </Card>
</div>

<!-- Runners-up: 2nd and 3rd Place -->
<div class="runners-up flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-6 sm:mb-8 mx-4">
  <!-- Second Place Card -->
  <Card class={twMerge(ladderOptions({variant: 'player', position: 'first'}), 'w-full max-w-[280px] sm:w-auto sm:min-w-[200px] sm:max-w-[220px]')}>
    <!-- Silver Crown -->
    <div class="absolute z-10 -right-4 sm:-right-6 -top-5 sm:-top-7 rotate-[-16deg]">
      <div class="sm:hidden">
        <StanleyCup size={70} color="#c0c0c0" />
      </div>
      <div class="hidden sm:block">
        <StanleyCup size={80} color="#c0c0c0" />
      </div>
    </div>
  
    <!-- Second Place Content -->
    <div class="flex flex-col gap-2 mb-3">
      <div class="relative">
        <div class="absolute left-2 top-6 w-1/4 h-[3px] bg-primary"></div>
        <h1 class={ladderTextOptions({type: 'rank', class: 'text-base sm:text-lg'})}>{ordinalNumbers(2)}</h1>
      </div>
      <h1 class={ladderTextOptions({type: 'title', class: 'text-center text-base sm:text-lg mb-2'})}>{ladder[1].playerName}</h1>
    </div>
  
    <!-- Second Score -->
    <div class={ladderOptions({variant: 'score', size: 'sm'})}>
      <h3 class={ladderTextOptions({type: 'score', class: 'text-center text-2xl sm:text-3xl'})}>{ladder[1].score}</h3>
    </div>
  </Card>
  
  <!-- Third Place Card -->
  <Card class={twMerge(ladderOptions({variant: 'player', position: 'first'}), 'w-full max-w-[280px] sm:w-auto sm:min-w-[200px] sm:max-w-[220px]')}>
    <!-- Bronze Crown -->
    <div class="absolute z-10 -right-4 sm:-right-6 -top-5 sm:-top-7 rotate-[-16deg]">
      <div class="sm:hidden">
        <StanleyCup size={70} color="#cd7f32" />
      </div>
      <div class="hidden sm:block">
        <StanleyCup size={80} color="#cd7f32" />
      </div>
    </div>
  
    <!-- Third Place Content -->
    <div class="flex flex-col gap-2 mb-3">
      <div class="relative">
        <div class="absolute left-2 top-6 w-1/4 h-[3px] bg-primary"></div>
        <h1 class={ladderTextOptions({type: 'rank', class: 'text-base sm:text-lg'})}>{ordinalNumbers(3)}</h1>
      </div>
      <h1 class={ladderTextOptions({type: 'title', class: 'text-center text-base sm:text-lg mb-2'})}>{ladder[2].playerName}</h1>
    </div>
    
    <!-- Third Score -->
    <div class={ladderOptions({variant: 'score', size: 'sm'})}>
      <h3 class={ladderTextOptions({type: 'score', class: 'text-center text-2xl sm:text-3xl'})}>{ladder[2].score}</h3>
    </div>
  </Card>
</div>



<!-- Remaining Players -->
<div class="flex flex-wrap gap-4 justify-center mx-4 sm:mx-6 mb-5">
  {#each ladder as player, i}
    {#if player.score > 0 && i > 2}
      <Card class={twMerge(ladderOptions({variant: 'player', size: 'sm'}), 'w-full max-w-44 sm:max-w-48')}>
        <!-- Player Info -->
        <div class="flex flex-col gap-1 mb-2">
          <div class="relative">
            <div class="absolute left-1 top-4 w-1/4 h-[2px] bg-primary"></div>
            <h1 class={ladderTextOptions({type: 'rank', class: 'text-sm'})}>{ordinalNumbers(i+1)}</h1>
          </div>
          <h1 class={ladderTextOptions({type: 'name', class: 'text-xs sm:text-sm'})}>{player.playerName}</h1>
        </div>

        <!-- Player Score -->
        <div class={ladderOptions({variant: 'score', size: 'sm'})}>
          <h3 class={ladderTextOptions({type: 'scoreSmall', class: 'text-lg sm:text-xl'})}>{player.score}</h3>
        </div>
      </Card>
    {/if}
  {/each}
</div>
{/if}
