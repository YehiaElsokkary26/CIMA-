// Bold rotating card-background system — built from Cima's existing brand
// hex values only (see tailwind.config.ts `colors` for the source tokens).
// Mirrors the reference UI's "each card gets a solid bold color" pattern
// without introducing any color outside the brand palette.

export interface CardColor {
  bg: string
  fg: string
  /** Translucent overlay tone for chips/pills sitting on top of this card */
  chip: string
}

export const CARD_COLORS: CardColor[] = [
  { bg: '#A32626', fg: '#E8DDCB', chip: 'rgba(232,221,203,0.16)' }, // Cinema Red
  { bg: '#B28A52', fg: '#161413', chip: 'rgba(22,20,19,0.14)' },    // Muted Gold
  { bg: '#C96A3D', fg: '#161413', chip: 'rgba(22,20,19,0.14)' },    // Film Burn Orange
  { bg: '#4A1E24', fg: '#E8DDCB', chip: 'rgba(232,221,203,0.14)' }, // Burgundy
  { bg: '#8B6B5C', fg: '#E8DDCB', chip: 'rgba(232,221,203,0.16)' }, // Dust Brown
]

export function cardColorFor(index: number): CardColor {
  return CARD_COLORS[((index % CARD_COLORS.length) + CARD_COLORS.length) % CARD_COLORS.length]
}
