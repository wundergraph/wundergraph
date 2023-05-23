const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,ts,jsx,tsx}', './content/**/*.{md,mdx}'],
	darkMode: 'class',
	theme: {
		fontSize: {
			xs: ['0.75rem', { lineHeight: '1rem' }],
			sm: ['0.875rem', { lineHeight: '1.25rem' }],
			base: ['1rem', { lineHeight: '1.5rem' }],
			lg: ['1.125rem', { lineHeight: '1.75rem' }],
			xl: ['1.25rem', { lineHeight: '2rem' }],
			'2xl': ['1.5rem', { lineHeight: '2.5rem' }],
			'3xl': ['2rem', { lineHeight: '2.5rem' }],
			'4xl': ['2.5rem', { lineHeight: '3rem' }],
			'5xl': ['3rem', { lineHeight: '3.5rem' }],
			'6xl': ['3.75rem', { lineHeight: '1' }],
			'7xl': ['4.5rem', { lineHeight: '1' }],
			'8xl': ['6rem', { lineHeight: '1' }],
			'9xl': ['8rem', { lineHeight: '1' }],
		},
		extend: {
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans],
				display: ['Lexend', ...defaultTheme.fontFamily.sans],
			},
			colors: {
				gray: {
					50: '#F9F9FB',
					100: '#F3F3F6',
					200: '#E5E5EB',
					300: '#D2D1DB',
					400: '#9D9CB0',
					500: '#6B6B80',
					600: '#4B4B63',
					700: '#393852',
					800: '#201F38',
					850: '#1A1A38',
					900: '#171632',
					950: '#101023',
				},
			},
			maxWidth: {
				'8xl': '88rem',
			},
		},
	},
	plugins: [
		require('tailwindcss-radix')(),
		require('@tailwindcss/typography'),
		require('tailwind-scrollbar')({ nocompatible: true }),
		require('@tailwindcss/forms'),
	],
};
