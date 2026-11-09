import { useId } from 'react'

// Two links of a chain, hooked into each other: two people connected.
const A = { x: 3, y: 7, width: 17, height: 12, rx: 6 }
const B = { x: 12, y: 13, width: 17, height: 12, rx: 6 }

const TONES = {
  color: ['#93a8ff', '#1d45e5'],
  onBlue: ['#93a8ff', '#ffffff'],
} as const

export function LogoMark({ size = 30, tone = 'color' }: { size?: number; tone?: keyof typeof TONES }) {
  const clip = useId()
  const [back, front] = TONES[tone]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="logo-mark" fill="none" strokeWidth={4}>
      <defs>
        <clipPath id={clip}>
          <circle cx="20" cy="13" r="4.2" />
        </clipPath>
      </defs>
      <rect {...A} stroke={back} />
      <rect {...B} stroke={front} />
      {/* A passes over B at the top right, under it at the bottom left. */}
      <rect {...A} stroke={back} clipPath={`url(#${CSS.escape(clip)})`} />
    </svg>
  )
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">blueLink</span>
    </span>
  )
}
