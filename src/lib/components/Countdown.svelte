<script lang="ts">
  import { differenceInSeconds} from 'date-fns'
  import { invalidateAll } from '$app/navigation';

  let {endTime}: {
    endTime: string | number | Date;
  } = $props()
  let now = Date.now()
  let end = new Date(endTime)

  let secondsRemaining = $state(differenceInSeconds(end, now))

  let h = $derived(Math.floor(secondsRemaining / 3600));
  let m = $derived(Math.floor((secondsRemaining - h * 3600) / 60))
  let s = $derived(secondsRemaining - h * 3600 - m * 60)

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
  <div class="font-bold text-3xl">
    <h2>
      <!-- {`${lessThan10(h)}${h}:${lessThan10(m)}${m}:${lessThan10(s)}${s}`} -->
      {`${zeroPad(h)}:${zeroPad(m)}:${zeroPad(s)}`}
    </h2> 
    <h2>Until the NHL Draft</h2>
  </div>
{/if}
    
