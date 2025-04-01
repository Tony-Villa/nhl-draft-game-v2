import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";
import { withTV } from "tailwind-variants/dist/transformer.js";

/** @type {import('tailwindcss').Config} */
const config = withTV({
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",

				// "primary": "#ff2d55",
				"primary": "#ff4f01",
				"secondary": "#0055ff",
				"accent": "#ffdf00",
				"black": "#000000",
				"white": "#ffffff",
				"offWhite": "#f2f2f2",
				"gray": "#888888",

				// primary: {
				// 	DEFAULT: "hsl(var(--primary) / <alpha-value>)",
				// 	foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				// },
				// secondary: {
				// 	DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
				// 	foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				// },
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				// accent: {
				// 	DEFAULT: "hsl(var(--accent) / <alpha-value>)",
				// 	foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				// },
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
        		},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {

				sans: ["Courier New", ...fontFamily.sans]
			},
			textShadow: {
				"text-shadow": "[text-shadow:3px_3px_0_#ff4f01]",
			},
			boxShadow: {
				'brut-shadow': '4px 4px 0px 0px #000000',
				'brut-shadow-sm': '2px 2px 0px 0px #000000',
				'button-shadow': '5px 5px 0 #000000',
				'section-shadow': '15px 15px 0 #000000'
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
			},
			animation: {
        		"accordion-down": "accordion-down 0.2s ease-out",
        		"accordion-up": "accordion-up 0.2s ease-out",
       			"caret-blink": "caret-blink 1.25s ease-out infinite",
      		},
		},
	},
	plugins: [tailwindcssAnimate],
});

export default config;
