<script lang="ts">
	// @ts-ignore
	import FaRegMoon from 'svelte-icons/fa/FaRegMoon.svelte';
	// @ts-ignore
	import WiDaySunny from 'svelte-icons/wi/WiDaySunny.svelte';

	const LIGHT = {
		bg: ' #e05a36',
		accent: '#47243b'
	};

	const DARK = {
		bg: ' #47243b',
		accent: '#c0c0c0'
	};

	const cmp: any = {
		light: WiDaySunny,
		dark: FaRegMoon
	};

	let isCurrentThemeLight = true;
	let selected = 'light';

	$: !isCurrentThemeLight ? (selected = 'light') : (selected = 'dark');

	const toggleTheme = () => {
		const body = document.body;
		const bg = getComputedStyle(body).getPropertyValue('--background-color');
		const accent = getComputedStyle(body).getPropertyValue('--accent-color');

		if (isCurrentThemeLight) {
			isCurrentThemeLight = false;
			body.style.setProperty('--background-color', DARK.bg);
			body.style.setProperty('--accent-color', DARK.accent);
		} else {
			isCurrentThemeLight = true;
			body.style.setProperty('--background-color', LIGHT.bg);
			body.style.setProperty('--accent-color', LIGHT.accent);
		}
	};
</script>

<button class="theme-toggle {!isCurrentThemeLight ? 'light' : 'dark'}" on:click={toggleTheme}>
	<div class="icon">
		<svelte:component this={cmp[selected]} />
	</div>
</button>

<style lang="postcss">
	.theme-toggle {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 70px;
		height: 40px;
		padding: 0;
		margin: 0;
		border: 2px solid black;
		border-radius: 6px;
		box-shadow: 2px 2px 0 black;

		@media (max-width: 1000px) {
			width: 45px;
			height: 30px;
		}
	}

	.light {
		background-color: #c0c0c0;

		.icon {
			color: black;
		}
	}

	.dark {
		background-color: #47243b;

		.icon {
			color: white;
		}
	}

	.icon {
		width: 28px;
		height: 28px;
		opacity: 100%;
		color: white;

		@media (max-width: 1000px) {
			width: 22px;
			height: 22px;
		}
	}
</style>
