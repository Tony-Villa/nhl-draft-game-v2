<script lang="ts">
	import SuperDebug from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms/client';

	export let data: PageData;

	const { form } = superForm(data.form);
</script>

<SuperDebug data={$form} />

<section class="login">
	<form method="POST">
		<label for="email">Email</label>
		<input type="email" id="email" name="email" bind:value={$form.email} />
		<label for="password">Password</label>
		<input type="password" id="password" name="password" bind:value={$form.password} />
		<button class="submit">Login</button>
	</form>
</section>

<style lang="postcss">
	.login {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100dvh;
	}
	form {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
