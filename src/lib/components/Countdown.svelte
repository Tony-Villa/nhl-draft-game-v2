<script lang="ts">
  import { differenceInSeconds} from 'date-fns'
  import { invalidateAll } from '$app/navigation';

  let {endTime}: {
    endTime: string | number | Date;
  } = $props()
  let now = Date.now()
  let end = new Date(endTime)

  let secondsRemaining = $state(differenceInSeconds(end, now))

  // let d = $derived(Math.floor(secondsRemaining / (24*60*60)))
  // let h = $derived(Math.floor(secondsRemaining / 3600));
  // let m = $derived(Math.floor((secondsRemaining - h * 3600) / 60))
  // let s = $derived(secondsRemaining - h * 3600 - m * 60)

  let {days, hours, minutes ,seconds} = $derived(convertSecToDHMS(secondsRemaining))

  function convertSecToDHMS(secondsRemaining: number) {
    const days = Math.floor(secondsRemaining / (3600 * 24))
    const hours = Math.floor((secondsRemaining % (3600 * 24)) / 3600)
    const minutes = Math.floor((secondsRemaining % 3600) / 60)
    const seconds = secondsRemaining % 60

    return {days, hours, minutes, seconds}
  }

  function updateTimer() {
      now = Date.now();
  }
  let interval: any;
  let timeout: any;


  async function rerunLoadFunction() {
		invalidateAll();
	}


$effect(() => {
  if(secondsRemaining > 0) {
    interval = setInterval(() => {
    secondsRemaining--
  }, 1000);
  } else {   
    timeout = setTimeout( () => {
      console.log('running rerun load func');
      rerunLoadFunction()
      }, 2500)
    
  }
  return () => {
    clearInterval(interval)
    clearTimeout(timeout);
  }
})

function zeroPad(n: number | string) {
  return ('0'+n).slice(-2);
}

</script>

{#if secondsRemaining > 0}
  <div class="border-black border-2 rounded-xl shadow-brut-shadow max-w-fit px-4 py-2 bg-orange-100 mx-auto">
    <h2 class="font-bold text-sm mb-1">NHL Draft starts in:</h2>
    <div class="flex gap-2 justify-center font-bold text-3xl border-black border-2 bg-blue-200 rounded-md p-4">
      {@render CountdownSection(days, 'days')}
      {@render CountdownClockSeparator()}
      {@render CountdownSection(hours, 'hours')}
      {@render CountdownClockSeparator()}
      {@render CountdownSection(minutes, 'minutes')}
      {@render CountdownClockSeparator()}
      {@render CountdownSection(seconds, 'seconds')}
    </div>
  </div>
{/if}

{#snippet CountdownClockSeparator()}
  <h2 class="font-bold text-3xl">
    :
  </h2>
{/snippet}
    
{#snippet CountdownSection(t, label)}
  <div class="flex flex-col">
    <h2 class="font-bold text-3xl">
      {zeroPad(t)}
    </h2>
    <p class="text-xs">{label}</p>
  </div>
{/snippet}