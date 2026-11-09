import type { Person } from '../types'

// Flat solid colors, deep like the night sky. The same person always gets the same one.
const COLORS = ['#1d45e5', '#0a1540', '#235f6b', '#4b3fb0', '#9a4a22', '#14587a', '#7d2f57', '#3f5c24']

export function colorFor(uid: string) {
  let h = 0
  for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ person, size = 44 }: { person: Pick<Person, 'uid' | 'name' | 'photo'>; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  if (person.photo) return <img className="avatar" src={person.photo} alt="" style={style} />
  return (
    <span className="avatar" style={{ ...style, background: colorFor(person.uid) }} aria-hidden>
      {initials(person.name)}
    </span>
  )
}
