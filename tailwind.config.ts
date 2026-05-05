import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        cta: 'hsl(var(--cta))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'film-badge': {
          DEFAULT: 'hsl(var(--film-badge))',
          foreground: 'hsl(var(--film-badge-foreground))',
        },
        'rating-star': 'hsl(var(--rating-star))',
        'cima-tag': {
          DEFAULT: 'hsl(var(--cima-tag))',
          foreground: 'hsl(var(--cima-tag-foreground))',
        },
        'record-led': 'hsl(var(--record-led))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        film: '0 4px 32px -4px hsl(248 36% 8% / 0.8), 0 2px 8px -2px hsl(248 36% 8% / 0.6)',
        card: '0 2px 16px -2px hsl(248 36% 8% / 0.6)',
        'glow-orange': '0 0 24px 4px hsl(27 86% 65% / 0.35)',
        'glow-pink': '0 0 20px 2px hsl(3 43% 82% / 0.25)',
        toast: '0 8px 32px -4px hsl(248 36% 8% / 0.8), 0 0 0 1px hsl(var(--border))',
      },
      keyframes: {
        'logo-flicker': {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.6' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.4' },
          '97%': { opacity: '1' },
        },
        'record-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
        'projector-flicker': {
          '0%, 100%': { opacity: '1' },
          '88%': { opacity: '1' },
          '89%': { opacity: '0.7' },
          '90%': { opacity: '1' },
          '95%': { opacity: '0.5' },
          '96%': { opacity: '1' },
        },
        'cta-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 hsl(27 86% 65% / 0.5)',
          },
          '50%': {
            boxShadow: '0 0 0 8px hsl(27 86% 65% / 0)',
          },
        },
        'cima-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.08)' },
          '70%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'logo-flicker': 'logo-flicker 6s ease-in-out infinite',
        'record-blink': 'record-blink 2s ease-in-out infinite',
        'projector-flicker': 'projector-flicker 8s ease-in-out infinite',
        'cta-pulse': 'cta-pulse 2.5s ease-in-out infinite',
        'cima-pop': 'cima-pop 0.4s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'slide-up': 'slide-up 0.35s ease-out',
      },
      typography: {
        film: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--border))',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--accent))',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--primary))',
            '--tw-prose-pre-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-bg': 'hsl(var(--card))',
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border))',
          },
        },
      },
    },
  },
  plugins: [animate, typography],
}

export default config
