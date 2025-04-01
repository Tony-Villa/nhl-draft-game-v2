<script>
  import * as Dialog from "$lib/components/ui/dialog";
	import { buttonOptions } from "./Button.options";
	import HowToPlay from "./HowToPlay.Content.svelte";

</script>



<Dialog.Root>
  <Dialog.Trigger class={`justify-self-start ${buttonOptions({variant: 'info', skew: 'right'})}`}>  
    How to play
  </Dialog.Trigger>

  <Dialog.Content class='max-w-[90%] max-h-[90%] overflow-auto'>
    <Dialog.Header>
      <Dialog.Title class="font-black text-2xl text-[#64748B]">How to play</Dialog.Title>
      <Dialog.Description>
        <HowToPlay />
      </Dialog.Description>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>