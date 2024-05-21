<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
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

    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            <Hamburger />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class='bg-[#FFF4E8]'>
          <DropdownMenu.Group>
            <DropdownMenu.Label>Sign in with</DropdownMenu.Label>
            <DropdownMenu.Separator />
            {#if isAuthenticated}
            <DropdownMenu.Item>
                <ul class="flex flex-row flex-end">
                    <form method="post" action="/draft-center?/logout">
                      <button onclick={clearLocalDraft}>Sign out</button>
                    </form>
                </ul>
            </DropdownMenu.Item>
            {:else}
            <DropdownMenu.Item class='bg-[#FFF4E8]'>
                <a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/google">
                    <Google />
                    Google
                </a>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
                <a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/discord">
                    <Discord />
                    Discord
                </a>
            </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Separator />
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

</nav>