import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/*
 * Klaket design system — Afeesh × Klaket.
 * Egyptian poster colour on a clapperboard grid.
 * Theme tokens live in src/index.css (light "newsprint" + dark "screening room").
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:   'hsl(var(--card))',
          foreground:'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:   'hsl(var(--popover))',
          foreground:'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:   'hsl(var(--primary))',
          foreground:'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:   'hsl(var(--secondary))',
          foreground:'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:   'hsl(var(--muted))',
          foreground:'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:   'hsl(var(--accent))',
          foreground:'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:   'hsl(var(--destructive))',
          foreground:'hsl(var(--destructive-foreground))',
        },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',

        /* Klaket theme roles */
        hot:         'hsl(var(--hot))',          // red used as text on the ground
        rule:        'hsl(var(--rule))',         // hairline dividers
        field:       'hsl(var(--field))',        // input / sheet surface
        solid: {
          DEFAULT:   'hsl(var(--solid))',        // inverted block (buttons, bands)
          foreground:'hsl(var(--solid-foreground))',
        },
        bar:         'hsl(var(--bar))',          // tab bar, always dark

        /* Fixed poster colours — identical in both themes */
        k: {
          paper:   '#F1E8D3',
          ink:     '#15120E',
          red:     '#C42320',
          mustard: '#F1B51C',
          teal:    '#1A6A65',
          coral:   '#F0614F',
          sand:    '#B8AE9C',
          smoke:   '#3A342B',
        },
      },

      borderRadius: {
        lg:  '0px',
        md:  '0px',
        sm:  '0px',
        xl:  '0px',
        '2xl': '0px',
        none:'0px',
      },

      fontFamily: {
        sans:    ['Archivo', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'Arial Narrow', 'Arial', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
        arabic:  ['"IBM Plex Sans Arabic"', 'Tahoma', 'sans-serif'],
        poster:  ['Lalezar', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },

      keyframes: {
        'cta-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(196,35,32,0.45)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(196,35,32,0)' },
        },
        'record-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.2' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'circle-draw': {
          '0%':   { strokeDashoffset: '520' },
          '100%': { strokeDashoffset: '0' },
        },
      },

      animation: {
        'cta-pulse':    'cta-pulse 2.5s ease-in-out infinite',
        'record-blink': 'record-blink 2s ease-in-out infinite',
        'fade-up':      'fade-up 0.35s ease-out',
        'circle-draw':  'circle-draw 0.45s ease-out forwards',
      },

      typography: {
        film: {
          css: {
            '--tw-prose-body':     'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-links':    'hsl(var(--hot))',
            '--tw-prose-bold':     'hsl(var(--foreground))',
          },
        },
      },
    },
  },
  plugins: [animate, typography],
}

export default config
