import { ROLES, SCHOOLS } from '../../shared/options.js'
import type { Person } from '../types'

export function ago(ts: number) {
  const s = (Date.now() - ts) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export function clock(ts: number) {
  return new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

export const schoolShort = (id: string) => SCHOOLS.find((s) => s.id === id)?.short ?? ''
export const schoolName = (id: string) => SCHOOLS.find((s) => s.id === id)?.name ?? ''
export const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? ''

// "BS Computer Science '26", "Alum · BS ITE '21", "Faculty or staff · SOSE"
export function personLine(p: Pick<Person, 'role' | 'course' | 'year' | 'school'>) {
  const yy = p.year ? ` '${String(p.year).slice(2)}` : ''
  const course = p.course ? p.course + yy : yy.trim()
  if (p.role === 'faculty') return ['Faculty or staff', schoolShort(p.school)].filter(Boolean).join(' · ')
  if (p.role === 'alum') return ['Alum', course].filter(Boolean).join(' · ')
  return course || schoolShort(p.school) || 'Student'
}

export function eventWhen(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  const dayText = day.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!time) return dayText
  const [h, min] = time.split(':').map(Number)
  const t = new Date(y, m - 1, d, h, min).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  return `${dayText} · ${t}`
}

export function eventDay(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  return { month: day.toLocaleDateString('en-PH', { month: 'short' }), day: String(d) }
}

// Square-crop and shrink a photo before upload.
export async function toJpeg(file: File, size = 400): Promise<string> {
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.85)
}
