<script lang="ts">
	import { differenceInSeconds } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';

	let {
		heading,
		endTime,
		children
	}: {
		heading?: string;
		endTime: string | number | Date;
		children?: any;
	} = $props();
	const now = Date.now();
	const end = new Date(untrack(() => endTime));

	let secondsRemaining = $state(differenceInSeconds(end, now));

	let { days, hours, minutes, seconds } = $derived(convertSecToDHMS(secondsRemaining));

	function convertSecToDHMS(secondsRemaining: number) {
		const days = Math.floor(secondsRemaining / (3600 * 24));
		const hours = Math.floor((secondsRemaining % (3600 * 24)) / 3600);
		const minutes = Math.floor((secondsRemaining % 3600) / 60);
		const seconds = secondsRemaining % 60;

		return { days, hours, minutes, seconds };
	}

	let interval: any;
	let timeout: any;

	async function rerunLoadFunction() {
		invalidateAll();
	}

	$effect(() => {
		if (secondsRemaining > 0) {
			interval = setInterval(() => {
				secondsRemaining--;
			}, 1000);
		} else {
			timeout = setTimeout(() => {
				rerunLoadFunction();
			}, 2500);
		}
		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	});

	function zeroPad(n: number | string) {
		return ('0' + n).slice(-2);
	}
</script>

{#if secondsRemaining > 0}
	<div class="shadow-brut-shadow mx-auto max-w-fit border-[3px] border-black bg-white p-4">
		<h2 class="mb-3 text-sm font-extrabold uppercase">{heading}</h2>
		<div
			class="bg-accent flex justify-center gap-3 border-[3px] border-black p-4 text-3xl font-extrabold"
		>
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
	<h2 class="text-3xl font-extrabold text-black">:</h2>
{/snippet}

{#snippet CountdownSection(t: number, label: string)}
	<div class="flex flex-col items-center">
		<h2 class="text-3xl font-extrabold text-black">
			{zeroPad(t)}
		</h2>
		<p class="text-xs font-extrabold text-black uppercase">{label}</p>
	</div>
{/snippet}
