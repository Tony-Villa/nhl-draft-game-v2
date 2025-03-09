import { tv, type VariantProps } from "tailwind-variants";

export const cardOptions = tv({
  base: 'bg-white border-black border-[3px] gap-4 relative',
  variants: {
    size: {
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-5',
    }
  },
  defaultVariants: {
    size: 'md'
  }
})  


type CardVariants = VariantProps<typeof cardOptions>;

export interface CardProps {
  size?: CardVariants['size'];
  class?: string;
  children: any;
  id?: string;
}