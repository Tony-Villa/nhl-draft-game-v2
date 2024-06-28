<script lang="ts">
  import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { fade } from 'svelte/transition';
	import Card from "./Card.svelte";
	import { getDraftState } from '$lib/globalState/draftState.svelte';
	import { compareString } from '$lib/helpers/compare-strings';

  const draftSystem = getDraftSystem();
  const draftState = getDraftState()

  let currentDraftPosition = $state(0)
  let currentStyle = $state('waiting')
  let userCurrentPick = $derived(draftSystem?.draftBoard[currentDraftPosition]?.prospect?.name || 'No pick')
  let NhlCurrentPick = $derived(draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name || ' ')

  $effect(() => {
    const draftPos = draftState.nhlDraftCurrentPick
    let totalPoints = draftSystem.computePoints()
    console.log(totalPoints);

    const timeout = setTimeout(() => {
      currentDraftPosition = draftPos
    }, 2000)

    return () => {
			clearTimeout(timeout);
		};
  })

  // $inspect('Current draft position', currentDraftPosition)
  // $inspect('Current user draft pick: ', draftSystem.draftBoard[currentDraftPosition])
  // $inspect('Current style: ', currentStyle)
  // $inspect('NHL DRAFT BOARD: ', draftSystem?.nhlDraftBoard)

  const cardStyles = `min-w-72 max-w-80 shadow-brut-shadow-sm`

  $effect(() => {
    if(!draftSystem?.nhlDraftBoard[currentDraftPosition]?.prospect?.name) {
      currentStyle = "waiting"
    } else {
      currentStyle = compareString(userCurrentPick, NhlCurrentPick) ? "win" : "lose"
    }
  })
</script>

<div class="flex flex-col items-center sm:flex-row justify-center my-4  gap-5  ">
  <Card class={cardStyles}>
    <div class="flex items-center px-2">
      {@render CurrentPick()}
      <div in:fade class='flex flex-1 justify-between'>
        <p class="ml-2 font-bold">{userCurrentPick}</p>
      </div>

    </div>
  </Card>

  <Card class={`${currentStyle === 'waiting' ? 'animate-pulse' : currentStyle === 'win' ? 'bg-lime-900' : 'bg-red-600'} min-w-72 max-w-80 shadow-brut-shadow-sm `}>
    <div class="flex items-center px-2">
      {@render CurrentPick()}
      <div in:fade class='flex flex-1 justify-between'>
        <p class="ml-2 font-bold">{NhlCurrentPick}</p>
      </div>

    </div>
  </Card>
</div>

{#snippet CurrentPick()}
  <h2>{currentDraftPosition + 1}</h2>
  <img class="h-[50px] w-[50px]" src={draftSystem?.draftBoard[currentDraftPosition]?.teamLogo} alt="" />
{/snippet}

