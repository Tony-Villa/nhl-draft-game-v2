<script lang="ts">
  import {buttonOptions, type ButtonProps} from './Button.options' 


	const { children, disabled = false,  variant = 'primary', size = 'md', skew = 'none', id, onclick }: ButtonProps = $props();
</script>

<button disabled={disabled} id={id} {onclick} class={buttonOptions({variant, size, skew})}>
    {@render children()}
</button>