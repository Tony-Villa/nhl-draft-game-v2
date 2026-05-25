<script lang="ts">
	import Hamburger from "$lib/icons/Hamburger.svelte";
	import { buttonOptions } from "../Button.options";
	import HowToPlay from "../HowToPlay.svelte";
    
  let { isAuthenticated } : {isAuthenticated : boolean} = $props() 

    function clearLocalDraft() {
		localStorage.removeItem('draftBoard');
	}

</script>

<nav class="flex justify-between px-3 pt-5 z-50">

    <HowToPlay />


      <div class="dropdown z-50">
         <Hamburger />
        <div class="dropdown-content bg-white overflow-hidden shadow-button-shadow border-2 border-black right-0 z-50">
          {#if isAuthenticated}
          <div>
              <ul class="flex flex-row flex-end">
                  <form method="post" action="/draft-center?/logout" class="w-full">
                    <button
                      type="submit"
                      class={buttonOptions({
                        variant: 'danger',
                        shadow: 'sm',
                        skew: 'left',
                        class: 'w-full whitespace-nowrap px-3 py-2'
                      })}
                      onclick={clearLocalDraft}
                    >
                      Sign out
                    </button>
                  </form>
              </ul>
          </div>
          {:else}
          <div class="flex flex-col gap-4 bg-[#FFF4E8] ">
            <a class={`${buttonOptions({variant: 'outline', class: 'justify-self-center'})}`} href="/auth/login/google">
              Google Login
            </a>
            <a class={`${buttonOptions({variant: 'secondary'})}`} href="/auth/login/discord">
              Discord Login
            </a>
          </div>
          {/if}
        </div>
      </div>

</nav>


<style>
  .dropdown {
    position: relative;
    display: inline-block;
  }
  
  .dropdown-content {
    display: none;
    position: absolute;
    min-width: 200px;
    padding: 20px;
    z-index: 1;
  }
  
  .dropdown:hover .dropdown-content {
    display: block;
  }
  </style>
