import type { OrgMini } from '../types'
import { SpaceCover } from './Network'

const COLORS = ['#0a1540', '#1d45e5', '#2f6f6a', '#6b4fc8', '#b8501c', '#0e6f8f', '#a3305e', '#4f7a1f']

function colorFor(id: string) {
  let h = 7
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

// Orgs get a square, people get a circle. You can tell them apart at a glance.
export function OrgLogo({ org, size = 44 }: { org: Pick<OrgMini, 'id' | 'name' | 'short' | 'logo'>; size?: number }) {
  const style = { width: size, height: size, borderRadius: size > 60 ? 4 : 3, fontSize: Math.round(size * (org.short && org.short.length > 3 ? 0.26 : 0.34)) }
  if (org.logo) return <img className="org-logo" src={org.logo} alt="" style={style} />
  const text = org.short && org.short.length <= 5 ? org.short : org.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3)
  return (
    <span className="org-logo" style={{ ...style, background: colorFor(org.id) }} aria-hidden>
      {text.toUpperCase()}
    </span>
  )
}

// An org's banner. Orgs with no picture get their own patch of sky.
export function OrgCover({ org }: { org: Pick<OrgMini, 'id' | 'cover'> }) {
  return org.cover ? <img className="cover-img" src={org.cover} alt="" /> : <SpaceCover seed={org.id} />
}
