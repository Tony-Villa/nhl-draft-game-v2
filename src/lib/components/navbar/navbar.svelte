<script lang="ts">
	import Header from '$lib/components/Header.svelte';
  import {type User} from '$lib/types'
	import HowToPlay from '../HowToPlay.svelte';
	import { page } from '$app/state';
	import { buttonOptions } from '../Button.options';

  let { isAuthenticated, user } : {isAuthenticated : boolean; user: User} = $props() 

  function clearLocalDraft() {
		localStorage.removeItem('draftBoard');
	}
    
</script>
    
<div class="grid grid-cols-[1fr_auto_1fr] items-center flex-1 py-3 mx-3 mb-8 pb-8 border-b-8 md:mx-10 md:flex-row ">

  <HowToPlay />

  {#if page.url.pathname.includes('draft-center')}
    <div class="justify-self-center">
      <a  href="/draft-center">
        <Header title="draft center" />
      </a>
    </div>
  {/if}

  <nav class="flex flex-row gap-10 justify-end items-center py-3 ">

  {#if isAuthenticated}
      <ul class="flex flex-row flex-end gap-5 items-center">
        <div class="flex flex-row items-center gap-2">
          {#if user?.avatarUrl}
            <img class="w-8 h-8 rounded-full" src={user?.avatarUrl} alt={`${user?.name}'s avatar'`}>
          {/if}
          <p class="font-bold md:text-lg">Welcome, {user?.name}</p>
        </div>
        <form method="post" action="/draft-center?/logout">
          <button
            type="submit"
            class={buttonOptions({
              variant: 'danger',
              size: 'sm',
              shadow: 'sm',
              skew: 'left',
              class: 'whitespace-nowrap px-3 py-2'
            })}
            onclick={clearLocalDraft}
          >
            Sign out
          </button>
        </form>
      </ul>
  {:else}
  <ul class="flex flex-row flex-end gap-5 items-center">
          <a class={`${buttonOptions({variant: 'outline'})}`} href="/auth/login/google">
            Google Login
          </a>
          <a class={`${buttonOptions({variant: 'secondary'})}`} href="/auth/login/discord">
            Discord Login
          </a>
      </ul>
  {/if}
  </nav>
</div>
    
