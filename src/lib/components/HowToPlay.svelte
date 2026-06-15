<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonOptions } from './Button.options';
	import HowToPlayContent from './HowToPlay.Content.svelte';
</script>

<Dialog.Root>
	<Dialog.Trigger class={`justify-self-start ${buttonOptions({ variant: 'info', skew: 'right' })}`}>
		How to play
	</Dialog.Trigger>

	<Dialog.Content
		class="shadow-section-shadow bg-offWhite max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden border-4 border-black p-0 sm:rounded-none"
		style="height: min(50rem, calc(100dvh - 2rem));"
	>
		<Dialog.Header class="h-full min-h-0 gap-0 overflow-hidden text-left">
			<div class="bg-accent border-b-4 border-black px-5 py-5 pr-14 sm:px-7">
				<p class="mb-1 text-xs font-black tracking-[0.2em] uppercase">Hockey Draft Showdown</p>
				<Dialog.Title
					class="text-3xl leading-none font-black tracking-tight text-black uppercase [text-shadow:2px_2px_0_#ff4f01] sm:text-4xl"
				>
					How to play
				</Dialog.Title>
			</div>
			<Dialog.Description class="min-h-0 flex-1 overflow-y-auto text-left text-black">
				<HowToPlayContent />
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
