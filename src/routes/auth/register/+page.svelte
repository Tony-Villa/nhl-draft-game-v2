<script lang="ts">
	import SuperDebug from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';

	let { data } = $props();

	const { enhance, errors, form, message, constraints } = superForm<{
		name: string;
		email: string;
		password: string;
	}>(data.registerUserFormData as never, {
		resetForm: true,
		taintedMessage: null,

		onUpdated: () => {
			if (!$message) return;

			const { alertType, alertText } = $message;

			if (alertType === 'success') {
				// Registration successful
			}

			if (alertType === 'error') {
				// Registration error
			}
		}
	});
</script>

<!-- <SuperDebug data={$form} /> -->

<section class="login">
	<form method="POST" action="/auth/register?/registerUser">
		<label for="name">Name</label>
		<input type="name" id="name" name="name" bind:value={$form.name} {...$constraints.name} />
		<label for="email">Email</label>
		<input type="email" id="email" name="email" bind:value={$form.email} {...$constraints.email} />
		<label for="password">Password</label>
		<input type="password" id="password" name="password" bind:value={$form.password} />
		<button class="submit">Login</button>
	</form>
	<div class="o-auth">
		<a href="/auth/login/discord"> discord </a>
	</div>
	<div class="o-auth">
		<a href="/auth/login/google"> google </a>
	</div>
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
