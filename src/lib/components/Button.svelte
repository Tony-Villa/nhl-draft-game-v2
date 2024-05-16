<script lang="ts">

 type Variant = 'primary' | 'secondary';

  interface ButtonProps {
    children: any;
    variant?: Variant;
    class?: string;
    id?: string;
    disabled?: boolean;
    onclick: () => void;
  }

	const { children, disabled = false,  variant = 'primary', class: className, id, onclick }: ButtonProps = $props();
</script>

<button disabled={disabled} id={id} {onclick} class={`border-2 shadow-brut-shadow-sm rounded-md border-solid border-black px-3 py-1 relative ${!disabled && 'sm:hover:bg-yellow-500'}
}
${disabled ? 'bg-neutral-400' : variant === 'primary' ? 'bg-yellow-400 font-semibold' : variant === 'secondary' ? 'bg-orange-100' : ''} ${className}`}>
    {@render children()}
</button>