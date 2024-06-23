<script lang="ts">
  import { differenceInSeconds} from 'date-fns'
  import { goto, invalidate, invalidateAll } from '$app/navigation';

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


  // function reloadPage() {
  //   const thisPage = window.location.pathname;

  //   console.log('goto ' + thisPage);

  //   goto('/').then(
  //       () => goto(thisPage)
  //   );
  // }

  async function rerunLoadFunction() {
		// any of these will cause the `load` function to rerun
		// invalidate("http://localhost:5173/draft-center");
		invalidateAll();

    // await goto('/wowowo', { replaceState: true, noScroll: true })
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
      // reloadPage()
      }, 2500)
    
  }
  return () => {
    clearInterval(interval)
    clearTimeout(timeout);
  }
})

function zeroPad(n) {
  // return n < 10 ? '0' : ''
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
    
