import { tv, type VariantProps  } from 'tailwind-variants';

export const buttonOptions = tv({
  base: `border-black border-[3px] font-extrabold cursor-pointer text-sm uppercase relative transition-all duration-100 ease-in-out shadow-button-shadow
  active:translate-x-[5px] active:translate-y-[5px] active:shadow-none
  hover:bg-accent hover:text-black
  `,
  variants: {
    variant: {
      primary: "text-white bg-primary",
      secondary: "text-white bg-secondary",
      outline: "text-black bg-white",
      info: "text-black bg-accent hover:bg-primary hover:text-white",
      danger: "bg-danger",
    },
    size: {
      sm: 'p-1',
      md: 'p-3',
      lg: 'p-4',
    },
    skew:{
      none: '',
      left: 'rotate-3',
      right: '-rotate-3'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    skew: 'none'
  }
})

type ButtonVariants = VariantProps<typeof buttonOptions>;

export interface ButtonProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  skew?: ButtonVariants['skew']; 
  children: any;
  disabled?: boolean;
  id?: string;
  onclick: () => void;
}