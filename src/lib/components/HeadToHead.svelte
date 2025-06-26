<script lang="ts">
  import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { fade } from 'svelte/transition';
	import Card from "./Card.svelte";
	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { compareString } from '$lib/helpers/compare-strings';

  const draftSystem = getDraftSystem();
  const draftState = getDraftState()

  let { currentPick }: {currentPick: number} = $props()

  let currentDraftPosition = $state(currentPick)
  let currentStyle = $state('waiting')
  let userCurrentPick = $derived(draftSystem?.draftBoard[currentDraftPosition]?.prospect?.name || 'No pick')
  let NhlCurrentPick = $derived(draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name || ' ')

  // Sync with parent's currentPick prop when it changes
  $effect(() => {
    if (currentPick > currentDraftPosition) {
      currentDraftPosition = currentPick
    }
  })

  $effect(() => {
    if(draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name ){
      // User head-to-head comparison
      let totalPoints = draftSystem.computePoints()
  
      const timeout = setTimeout(() => {
        // Advance to the next pick position, but don't exceed the draft length
        const nextPosition = Math.min(currentDraftPosition + 1, 31)
        currentDraftPosition = nextPosition
      }, 5000)
  
      return () => {
        clearTimeout(timeout);
      };
    }
  })

  // $inspect('Current draft position', currentDraftPosition)
  // $inspect('Current user draft pick: ', draftSystem.draftBoard[currentDraftPosition])
  // $inspect('Current style: ', currentStyle)
  // $inspect('NHL DRAFT BOARD: ', draftSystem?.nhlDraftBoard)

  const cardStyles = `min-w-72 max-w-80 shadow-brut-shadow`

  $effect(() => {
    if(!draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name) {
      currentStyle = "waiting"
    } else {
      currentStyle = compareString(userCurrentPick, NhlCurrentPick) ? "win" : "lose"
    }
  })
</script>

<div class="flex flex-col items-center sm:flex-row justify-center my-6 gap-6">
  <!-- User Pick Card -->
  <Card class={`${cardStyles} bg-white`}>
    <div class="text-center">
      <div class="relative">
        <h3 class="text-sm font-bold uppercase tracking-wide mb-3 relative inline-block">
          Your Pick
          <span class="absolute bottom-0 left-0 w-full h-1 bg-primary"></span>
        </h3>
      </div>
      
      <!-- Fixed height container to match NHL card -->
      <div class="flex items-center justify-between gap-4 mb-3 min-h-[48px]">
        <!-- Left side - Number and Logo -->
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold">#{currentDraftPosition + 1}</span>
          <img class="h-12 w-12" src={draftSystem?.draftBoard[currentDraftPosition]?.teamLogo} alt="" />
        </div>
        
        <!-- Right side - Empty space to match NHL card structure -->
        <div class="w-[60px] h-[32px]"></div>
      </div>
      
      <Card class="bg-white shadow-brut-shadow-sm">
        <p class="font-bold text-lg py-2 px-3">{userCurrentPick}</p>
      </Card>
    </div>
  </Card>

  <!-- VS Divider -->
  <div class="text-3xl font-bold text-gray-400 hidden sm:block">VS</div>

  <!-- NHL Pick Card -->
  <Card class={`${cardStyles} ${
    currentStyle === 'waiting' 
      ? 'animate-pulse bg-white' 
      : currentStyle === 'win' 
        ? 'bg-green-500' 
        : 'bg-red-500'
  }`}>
    <div class="text-center">
      <div class="relative">
        <h3 class={`text-sm font-bold uppercase tracking-wide mb-3 relative inline-block ${
          currentStyle === 'waiting' ? 'text-black' : 'text-white'
        }`}>
          NHL Pick
          <span class="absolute bottom-0 left-0 w-full h-1 bg-primary"></span>
        </h3>
      </div>
      
      <!-- Fixed height container to prevent layout shift -->
      <div class="flex items-center justify-between gap-4 mb-3 min-h-[48px]">
        <!-- Left side - Number and Logo -->
        <div class="flex items-center gap-3">
          <span class={`text-2xl font-bold ${
            currentStyle === 'waiting' ? 'text-black' : 'text-white'
          }`}>#{currentDraftPosition + 1}</span>
          <img class="h-12 w-12" src={draftSystem?.draftBoard[currentDraftPosition]?.teamLogo} alt="" />
        </div>
         <!-- Right side - Status Badge (fixed position) -->
        <div class="w-[60px] h-[32px] flex items-center justify-center">
          {#if currentStyle === 'win'}
            <div class="bg-green-700 text-white rounded-md px-2 py-1 border-2 border-black">
              <span class="font-bold text-xs">MATCH</span>
            </div>
          {:else if currentStyle === 'lose'}
            <div class="bg-red-700 text-white rounded-md px-2 py-1 border-2 border-black">
              <span class="font-bold text-xs">MISS</span>
            </div>
          {/if}
        </div>
      </div>
      
      <Card class="bg-white shadow-brut-shadow-sm">
        <p class="font-bold text-lg py-2 px-3 text-black">
          {currentStyle === 'waiting' ? '...' : NhlCurrentPick}
        </p>
      </Card>
    </div>
  </Card>
</div>

