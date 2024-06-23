<script lang="ts">
  import Google from '$lib/icons/Google.svelte';
  import Discord from '$lib/icons/Discord.svelte';
	import Button from '$lib/components/Button.svelte';
  import * as Dialog from "$lib/components/ui/dialog";
  import {type User} from '$lib/types'

  let { isAuthenticated, user } : {isAuthenticated : boolean; user: User} = $props() 

  const baseButtonStyles = 'border-2 shadow-brut-shadow-sm rounded-md border-solid border-black px-3 py-1 relative';

  function clearLocalDraft() {
		localStorage.removeItem('draftBoard');
	}
    
</script>
    
<div class="flex flex-col justify-between flex-1 py-3  mx-3 md:mx-10 md:flex-row">

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

  <nav class="flex flex-row gap-10 justify-end items-center py-3 ">

  {#if isAuthenticated}
      <ul class="flex flex-row flex-end gap-5 items-center">
        <div class="flex flex-row items-center gap-2">
          {#if user?.avatarUrl}
            <img class="w-8 h-8 rounded-full" src={user?.avatarUrl} alt={`${user?.name}'s avatar'`}>
          {/if}
          <p class="font-bold md:text-lg">Welcome, {user?.name}</p>
        </div>
        <p> | </p>
        <form method="post" action="/draft-center?/logout">
          <button onclick={clearLocalDraft}>Sign out</button>
        </form>
      </ul>
  {:else}
  <ul class="flex flex-row flex-end gap-5 items-center">
        <p>Sign in with </p>
          <a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/google">
            <Google />
            Google
          </a>
          <a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/discord">
            <Discord />
            Discord
          </a>
      </ul>
  {/if}
  </nav>
</div>
    
