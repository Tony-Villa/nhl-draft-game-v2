<script lang="ts">
	import type { AuthProviderSurface } from '$lib/remote/auth.schemas';
	import { getAuthProviders } from '$lib/remote/auth.remote';
	import { authProviders } from '$lib/auth/providers';

	let { surface }: { surface: AuthProviderSurface } = $props();
</script>

<svelte:boundary>
	{@render providerList((await getAuthProviders({ surface })).providers, 'remote')}

	{#snippet pending()}
		{@render providerList(authProviders, 'fallback')}
	{/snippet}

	{#snippet failed()}
		{@render providerList(authProviders, 'fallback')}
	{/snippet}
</svelte:boundary>

{#snippet providerList(
	providers: readonly (typeof authProviders)[number][],
	source: 'fallback' | 'remote'
)}
	<section class="login" data-remote-source={source}>
		{#each providers as provider (provider.id)}
			<div class="o-auth">
				<a href={provider.href}>{provider.label}</a>
			</div>
		{/each}
	</section>
{/snippet}

<style lang="postcss">
	.login {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100dvh;
	}

	.o-auth {
		display: flex;
		margin-block: 0.5rem;
	}
</style>
