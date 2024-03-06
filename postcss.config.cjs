const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const postcssJitProps = require('postcss-jit-props');
const openProps = require('open-props');
const postcssPresetEnv = require('postcss-preset-env');
const pfm = require('postcss-font-magician');

const config = {
	plugins: [
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		tailwindcss/nesting,
		tailwindcss(),
		//But others, like autoprefixer, need to run after,
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		// tailwindcss(),
		//But others, like autoprefixer, need to run after,
		autoprefixer,
		pfm({
			variants: {
				'Public Sans': {
					700: [],
					800: [],
					900: []
				}
			}
		}),
		postcssJitProps(openProps),
		postcssPresetEnv({
			features: { 'nesting-rules': true }
		}),
		autoprefixer
	]
};

module.exports = config;
