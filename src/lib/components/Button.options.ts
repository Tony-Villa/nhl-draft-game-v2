import { tv, type VariantProps } from 'tailwind-variants';

export const buttonOptions = tv({
	base: `hover:bg-accent relative cursor-pointer border-[3px] border-black text-sm font-extrabold uppercase transition-all duration-100 ease-in-out hover:text-black active:translate-x-[5px] active:translate-y-[5px] active:shadow-none`,
	variants: {
		variant: {
			primary: 'bg-primary text-black',
			secondary: 'bg-secondary text-white',
			outline: 'bg-white text-black',
			info: 'bg-accent hover:bg-primary text-black',
			danger: 'bg-danger',
			disabled:
				'translate-x-0 translate-y-0 cursor-not-allowed bg-white text-black opacity-45 shadow-none hover:bg-white active:translate-x-0 active:translate-y-0'
		},
		size: {
			sm: 'p-1',
			md: 'p-3',
			lg: 'p-4'
		},
		shadow: {
			none: 'shadow-none',
			sm: 'shadow-button-sm',
			md: 'shadow-button-shadow'
		},
		skew: {
			none: '',
			left: 'rotate-3',
			right: '-rotate-3'
		}
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
		shadow: 'md',
		skew: 'none'
	}
});

type ButtonVariants = VariantProps<typeof buttonOptions>;

export interface ButtonProps {
	variant?: ButtonVariants['variant'];
	size?: ButtonVariants['size'];
	skew?: ButtonVariants['skew'];
	shadow?: ButtonVariants['shadow'];
	class?: string;
	children: any;
	disabled?: boolean;
	id?: string;
	ariaPressed?: boolean;
	onclick: () => void;
}
