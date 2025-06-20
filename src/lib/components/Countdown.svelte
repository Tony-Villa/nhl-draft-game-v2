<script lang="ts">
  import { differenceInSeconds} from 'date-fns'
  import { invalidateAll } from '$app/navigation';

  let {heading, endTime, children}: {
    heading?: string
    endTime: string | number | Date;
    children?: any
  } = $props()
  let now = Date.now()
  let end = new Date(endTime)

  let secondsRemaining = $state(differenceInSeconds(end, now))

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
  <div class="bg-white border-black border-[3px] shadow-brut-shadow max-w-fit p-4 mx-auto">
    <h2 class="font-extrabold text-sm mb-3 uppercase">{heading}</h2>
    <div class="flex gap-3 justify-center font-extrabold text-3xl bg-accent border-black border-[3px]  p-4">
      {@render CountdownSection(days, 'days')}
      {@render CountdownClockSeparator()}
      {@render CountdownSection(hours, 'hours')}
      {@render CountdownClockSeparator()}
      {@render CountdownSection(minutes, 'minutes')}
      {@render CountdownClockSeparator()}
      {@render CountdownSection(seconds, 'seconds')}
    </div>
    {@render children()}
  </div>
{/if}

{#snippet CountdownClockSeparator()}
  <h2 class="font-extrabold text-3xl text-black">
    :
  </h2>
{/snippet}
    
{#snippet CountdownSection(t: number, label: string)}
  <div class="flex flex-col items-center">
    <h2 class="font-extrabold text-3xl text-black">
      {zeroPad(t)}
    </h2>
    <p class="text-xs font-extrabold uppercase text-black">{label}</p>
  </div>
{/snippet}