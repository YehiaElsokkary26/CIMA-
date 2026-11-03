import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { StillKind } from '@/lib/klaket'

interface StillProps {
  kind: StillKind
  className?: string
}

/**
 * Illustrated poster still in the Afeesh style: flat poster colours,
 * ink silhouettes and a halftone screen. Used whenever a film has no
 * thumbnail, and for decorative moments (welcome wall, profile header).
 */
export default function Still({ kind, className }: StillProps) {
  const uid = useId().replace(/:/g, '')
  const dots = `kd-${uid}`
  const grain = `kg-${uid}`

  return (
    <svg
      viewBox="0 0 300 300"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block w-full h-full', className)}
      aria-hidden="true"
    >
      <defs>
        <pattern id={dots} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.25" fill="#15120E" />
        </pattern>
        <pattern id={grain} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="#F1E8D3" />
        </pattern>
      </defs>
      {SCENES[kind](`url(#${dots})`, `url(#${grain})`)}
    </svg>
  )
}

const SCENES: Record<StillKind, (dots: string, grain: string) => JSX.Element> = {
  // Salt & Iron: blacksmith at the anvil
  smith: (dots) => (
    <g>
      <rect width="300" height="300" fill="#F1B51C" />
      <circle cx="210" cy="96" r="78" fill="#C42320" />
      <rect width="300" height="300" fill={dots} opacity=".28" />
      <path d="M0 236 H300 V300 H0Z" fill="#15120E" />
      <path d="M150 214 h96 l-14 18 h-20 v16 h22 v12 h-74 v-12 h22 v-16 h-18z" fill="#15120E" stroke="#F1E8D3" strokeWidth="2" />
      <circle cx="96" cy="92" r="30" fill="#15120E" />
      <path d="M44 300 C 44 190, 70 140, 98 132 C 130 140, 150 180, 152 236 L 152 300 Z" fill="#15120E" />
      <path d="M120 150 L 176 96" stroke="#15120E" strokeWidth="16" strokeLinecap="round" />
      <rect x="164" y="74" width="38" height="20" transform="rotate(-45 183 84)" fill="#15120E" />
      <path d="M200 206 l14 -26 l2 20 l16 -18 l-8 24 l20 -6 l-22 14z" fill="#F1E8D3" />
      <path d="M232 190 l6 -10 M246 204 l12 -4 M188 192 l-6 -12" stroke="#F1E8D3" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  // Alexandria tram at dusk
  tram: (dots) => (
    <g>
      <rect width="300" height="300" fill="#1A6A65" />
      <rect width="300" height="120" fill="#F1B51C" />
      <circle cx="70" cy="120" r="44" fill="#C42320" />
      <rect width="300" height="300" fill={dots} opacity=".22" />
      <path d="M0 64 L300 52" stroke="#15120E" strokeWidth="3" />
      <path d="M150 58 L130 98 M150 58 L170 98" stroke="#15120E" strokeWidth="3" />
      <rect x="40" y="98" width="230" height="120" fill="#F1E8D3" stroke="#15120E" strokeWidth="4" />
      <rect x="40" y="168" width="230" height="16" fill="#C42320" />
      <rect x="54" y="112" width="40" height="44" fill="#15120E" />
      <rect x="104" y="112" width="40" height="44" fill="#15120E" />
      <rect x="154" y="112" width="40" height="44" fill="#15120E" />
      <rect x="204" y="112" width="52" height="44" fill="#F1B51C" stroke="#15120E" strokeWidth="3" />
      <circle cx="92" cy="226" r="14" fill="#15120E" />
      <circle cx="220" cy="226" r="14" fill="#15120E" />
      <path d="M0 244 H300" stroke="#15120E" strokeWidth="6" />
      <path d="M0 300 L120 244 M300 300 L190 244" stroke="#F1E8D3" strokeWidth="3" />
    </g>
  ),
  // Koshary bowl under a neon sign
  koshary: (_dots, grain) => (
    <g>
      <rect width="300" height="300" fill="#15120E" />
      <circle cx="232" cy="64" r="34" fill="#F1E8D3" />
      <circle cx="218" cy="56" r="30" fill="#15120E" />
      <rect x="28" y="36" width="150" height="54" fill="none" stroke="#F1B51C" strokeWidth="5" />
      <text x="103" y="74" textAnchor="middle" fontFamily="Lalezar, sans-serif" fontSize="34" fill="#F1B51C">كشري</text>
      <path d="M40 180 H260 C 256 250, 210 276, 150 276 C 90 276, 44 250, 40 180Z" fill="#C42320" stroke="#F1E8D3" strokeWidth="4" />
      <path d="M50 180 C 80 150, 220 150, 250 180Z" fill="#F1B51C" />
      <rect x="40" y="150" width="220" height="130" fill={grain} opacity=".25" />
      <path d="M110 140 c-10 -14 10 -22 0 -36 M150 136 c-10 -14 10 -22 0 -36 M190 140 c-10 -14 10 -22 0 -36" stroke="#F1E8D3" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M232 184 L 290 120" stroke="#F1E8D3" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  // Reeds, the river, a TV full of noise
  delta: (dots, grain) => (
    <g>
      <rect width="300" height="300" fill="#F1E8D3" />
      <path d="M0 196 C 60 176, 110 214, 170 196 S 260 180, 300 190 V300 H0Z" fill="#1A6A65" />
      <rect width="300" height="300" fill={dots} opacity=".2" />
      <rect x="128" y="70" width="128" height="100" rx="10" fill="#15120E" />
      <rect x="140" y="82" width="104" height="76" fill="#C42320" />
      <rect x="140" y="82" width="104" height="76" fill={grain} />
      <path d="M170 70 L150 32 M210 70 L238 28" stroke="#15120E" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 170 v26 M234 170 v26" stroke="#15120E" strokeWidth="6" />
      <path d="M24 300 C 30 220, 26 170, 40 120 M48 300 C 52 230, 60 190, 70 150 M70 300 C 74 240, 84 210, 98 176 M14 300 C 12 250, 6 210, 0 180" stroke="#15120E" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M36 128 l-10 -24 l16 18z M66 156 l-4 -26 l12 22z M94 180 l2 -24 l8 22z" fill="#15120E" />
    </g>
  ),
  // Shubra rooftops against a red sky
  rooftop: (dots) => (
    <g>
      <rect width="300" height="300" fill="#C42320" />
      <circle cx="210" cy="118" r="56" fill="#F1B51C" />
      <rect width="300" height="300" fill={dots} opacity=".25" />
      <path d="M0 196 h44 v-40 h40 v24 h30 v-60 h46 v52 h36 v-30 h50 v34 h54 V300 H0Z" fill="#15120E" />
      <ellipse cx="66" cy="148" rx="20" ry="11" transform="rotate(-25 66 148)" fill="#F1E8D3" stroke="#15120E" strokeWidth="3" />
      <ellipse cx="140" cy="112" rx="16" ry="9" transform="rotate(-25 140 112)" fill="#F1E8D3" stroke="#15120E" strokeWidth="3" />
      <ellipse cx="226" cy="150" rx="18" ry="10" transform="rotate(-25 226 150)" fill="#F1E8D3" stroke="#15120E" strokeWidth="3" />
      <path d="M0 86 C 80 108, 180 108, 300 80" stroke="#15120E" strokeWidth="2" fill="none" />
      <rect x="40" y="94" width="24" height="30" fill="#1A6A65" />
      <rect x="96" y="100" width="20" height="36" fill="#F1E8D3" />
      <rect x="176" y="98" width="28" height="26" fill="#1A6A65" />
      <rect x="246" y="88" width="18" height="30" fill="#F1E8D3" />
    </g>
  ),
  // Two profiles facing each other
  mother: (dots) => (
    <g>
      <rect width="300" height="300" fill="#1A6A65" />
      <rect x="150" width="150" height="300" fill="#F1B51C" />
      <rect width="300" height="300" fill={dots} opacity=".22" />
      <path d="M0 300 V80 C 40 60, 96 64, 112 104 C 118 118, 116 128, 124 138 L 132 152 L 120 158 C 122 172, 118 184, 112 190 C 114 200, 108 210, 96 210 C 92 228, 80 240, 60 248 L 70 300 Z" fill="#15120E" />
      <path d="M300 300 V96 C 262 78, 210 84, 196 120 C 190 134, 192 144, 184 154 L 176 166 L 188 172 C 186 184, 190 194, 196 200 C 194 210, 200 218, 210 218 C 214 234, 226 244, 244 252 L 236 300 Z" fill="#C42320" />
    </g>
  ),
  // A ful cart under an umbrella
  ful: (dots) => (
    <g>
      <rect width="300" height="300" fill="#F1B51C" />
      <rect width="300" height="300" fill={dots} opacity=".22" />
      <path d="M50 120 C 70 54, 230 54, 250 120Z" fill="#C42320" stroke="#15120E" strokeWidth="4" />
      <path d="M90 120 C 100 80, 120 66, 150 62 M210 120 C 200 80, 180 66, 150 62" stroke="#15120E" strokeWidth="3" fill="none" />
      <path d="M150 120 V160" stroke="#15120E" strokeWidth="5" />
      <rect x="60" y="160" width="180" height="70" fill="#1A6A65" stroke="#15120E" strokeWidth="4" />
      <path d="M120 160 c0 -26 60 -26 60 0Z" fill="#F1E8D3" stroke="#15120E" strokeWidth="4" />
      <text x="150" y="208" textAnchor="middle" fontFamily="Lalezar, sans-serif" fontSize="28" fill="#F1E8D3">فول</text>
      <circle cx="96" cy="250" r="20" fill="#15120E" />
      <circle cx="204" cy="250" r="20" fill="#15120E" />
      <circle cx="96" cy="250" r="6" fill="#F1B51C" />
      <circle cx="204" cy="250" r="6" fill="#F1B51C" />
      <path d="M0 270 H300" stroke="#15120E" strokeWidth="4" />
    </g>
  ),
  // Filmmaker behind a camera
  portrait: (dots) => (
    <g>
      <rect width="300" height="300" fill="#1A6A65" />
      <circle cx="196" cy="120" r="96" fill="#F1B51C" />
      <rect width="300" height="300" fill={dots} opacity=".25" />
      <circle cx="196" cy="104" r="40" fill="#15120E" />
      <path d="M110 300 C 112 210, 150 166, 196 162 C 242 166, 280 210, 282 300Z" fill="#15120E" />
      <rect x="122" y="110" width="74" height="50" fill="#C42320" stroke="#F1E8D3" strokeWidth="3" />
      <circle cx="122" cy="135" r="20" fill="#15120E" stroke="#F1E8D3" strokeWidth="3" />
      <circle cx="122" cy="135" r="8" fill="#F1E8D3" />
      <rect x="146" y="92" width="34" height="18" fill="#15120E" stroke="#F1E8D3" strokeWidth="3" />
    </g>
  ),
}
