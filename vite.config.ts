import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()] as any,
	optimizeDeps: {
		// Remote queries and the async runtime flag must resolve to the same live Svelte module.
		exclude: ['svelte']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		noExternal: ['flowbite-svelte', 'bits-ui', 'svelte-french-toast']
	}
});
