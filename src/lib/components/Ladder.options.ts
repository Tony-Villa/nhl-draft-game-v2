import { tv, type VariantProps } from "tailwind-variants";

export const ladderOptions = tv({
  base: 'border-black border-[3px] font-extrabold relative bg-white shadow-brut-shadow',
  variants: {
    variant: {
      winner: 'bg-white text-black',
      player: 'bg-white text-black',
      score: 'bg-accent text-black border-black border-[3px] rounded-md'
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
    position: {
      first: 'relative z-10',
      other: 'relative'
    }
  },
  defaultVariants: {
    variant: 'player',
    size: 'md',
    position: 'other'
  }
});

export const ladderTextOptions = tv({
  base: 'uppercase font-extrabold',
  variants: {
    type: {
      title: 'mb-2 font-bold',
      score: 'font-bold',
      name: 'font-extrabold',
      rank: 'font-extrabold',
      scoreSmall: 'font-bold text-center',
      background: 'text-9xl text-gray-500 opacity-60 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)]'
    }
  },
  defaultVariants: {
    type: 'name'
  }
});

type LadderVariants = VariantProps<typeof ladderOptions>;
type LadderTextVariants = VariantProps<typeof ladderTextOptions>;

export interface LadderProps {
  variant?: LadderVariants['variant'];
  size?: LadderVariants['size'];
  position?: LadderVariants['position'];
  class?: string;
}

export interface LadderTextProps {
  type?: LadderTextVariants['type'];
  class?: string;
}
