<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
	import Discord from "$lib/icons/Discord.svelte";
	import Google from "$lib/icons/Google.svelte";
	import Button from '$lib/components/Button.svelte';
	import Hamburger from "$lib/icons/Hamburger.svelte";
    
    let {isAuthenticated} : {isAuthenticated : boolean} = $props()

    const baseButtonStyles = 'border-2 shadow-brut-shadow-sm rounded-md border-solid border-black px-3 py-1 relative';

    function clearLocalDraft() {
		localStorage.removeItem('draftBoard');
	}

</script>

<nav class="flex justify-between px-3">

    <Dialog.Root>
        <Dialog.Trigger>
          <Button variant='secondary' onclick={() => {}}> How to play </Button>
        </Dialog.Trigger>
    
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>How to play</Dialog.Title>
            <Dialog.Description>
    
            </Dialog.Description>
          </Dialog.Header>
        </Dialog.Content>
      </Dialog.Root>


      <div class="dropdown ">
         <Hamburger />
        <div class="dropdown-content bg-[#FFF4E8] overflow-hidden shadow-brut-shadow border-2 border-black rounded-md right-0">
          {#if isAuthenticated}
          <div>
              <ul class="flex flex-row flex-end">
                  <form method="post" action="/draft-center?/logout">
                    <button onclick={clearLocalDraft}>Sign out</button>
                  </form>
              </ul>
          </div>
          {:else}
          <p class="px-2 py-1.5 text-sm font-semibold">Sign in with</p>
          <div class="flex flex-col gap-2 bg-[#FFF4E8] ">
              <a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/google">
                  <Google />
                  Google
              </a>
              <a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/discord">
                  <Discord />
                  Discord
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
    min-width: 160px;
    padding: 12px 16px;
    z-index: 1;
  }
  
  .dropdown:hover .dropdown-content {
    display: block;
  }
  </style>