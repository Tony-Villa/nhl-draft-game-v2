const autoprefixer = require('autoprefixer');
const postcssJitProps = require('postcss-jit-props');
const openProps = require('open-props');
const postcssPresetEnv = require('postcss-preset-env');
const pfm = require('postcss-font-magician');

const config = {
	plugins: [
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
		})
	]
};

module.exports = config;
