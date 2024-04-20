<script>
	import toast_ from 'svelte-french-toast';

	export let toast;

	// Use this component in your app:
	// toast(RichContent, { props: { someProp: '⭐' }})

	export let someProp;
</script>
<span>
	Custom and <b>bold</b> with props like {someProp}!
	<button on:click={() => toast_.dismiss(toast.id)}>Dismiss</button>
</span>