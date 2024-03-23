/** @type {import('tailwindcss').Config}*/
/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			boxShadow: {
				'brut-shadow': '4px 4px 0px 0px #000000',
				'brut-shadow-sm': '2px 2px 0px 0px #000000',
			}
		}
	},

	plugins: []
};

module.exports = config;
