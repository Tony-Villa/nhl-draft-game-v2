<script lang="ts">
	import { enhance } from '$app/forms';
	import { buttonOptions } from './Button.options';
	import { PendingForm } from '$lib/forms/pending-form.svelte';

	let {
		class: className = '',
		buttonClass = ''
	}: {
		class?: string;
		buttonClass?: string;
	} = $props();

	const pendingForm = new PendingForm();

	function clearLocalDraft() {
		localStorage.removeItem('draftBoard');
	}
</script>

<form
	method="post"
	action="/draft-center?/logout"
	class={className}
	use:enhance={pendingForm.enhance('sign-out')}
	onsubmit={clearLocalDraft}
	aria-busy={pendingForm.is('sign-out')}
>
	<button
		type="submit"
		class={buttonOptions({
			variant: 'danger',
			size: 'sm',
			shadow: 'sm',
			skew: 'left',
			class: `px-3 py-2 whitespace-nowrap ${buttonClass} ${pendingForm.is('sign-out') ? 'pending-control' : ''}`
		})}
		disabled={pendingForm.is('sign-out')}
	>
		{pendingForm.is('sign-out') ? 'Signing out...' : 'Sign out'}
	</button>
</form>
