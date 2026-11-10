import { useRef, useState, type KeyboardEvent } from 'react'
import { Camera } from '@phosphor-icons/react/dist/csr/Camera'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { COURSES, LEVELS, ROLES } from '../../shared/options.js'
import { Avatar } from './Avatar'
import { Combo } from './Combo'
import { api } from '../lib/api'
import { toJpeg } from '../lib/format'
import type { FullPerson } from '../types'

export interface ProfileDraft {
  name: string
  role: string
  course: string
  level: string
  year: number | null
  headline: string
  about: string
  openTo: string[]
  skills: string[]
}

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 70 }, (_, i) => THIS_YEAR + 5 - i)

export function BasicsFields({ value, set }: { value: ProfileDraft; set: (p: Partial<ProfileDraft>) => void }) {
  const faculty = value.role === 'faculty'
  return (
    <>
      <label className="field">
        <span>Full name</span>
        <input className="input" value={value.name} maxLength={60} autoComplete="name" placeholder="e.g. Bea Santos" onChange={(e) => set({ name: e.target.value })} />
      </label>

      <div className="field">
        <span>I am</span>
        <div className="seg">
          {ROLES.map((r) => (
            <button type="button" key={r.id} className={value.role === r.id ? 'is-on' : ''} onClick={() => set({ role: r.id })}>
              {r.id === 'student' ? 'A student' : r.id === 'alum' ? 'Alumni' : 'Faculty or staff'}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <label className="field is-grow">
          <span>{faculty ? 'Department or office' : 'Course'}</span>
          <Combo
            value={value.course}
            options={faculty ? [] : COURSES}
            maxLength={80}
            placeholder={faculty ? 'e.g. Department of Economics' : 'Type to search, e.g. Comp Sci'}
            onChange={(course) => set({ course })}
          />
        </label>
        {value.role === 'student' && (
          <label className="field">
            <span>Year</span>
            <LevelSelect value={value.level} onChange={(level) => set({ level })} />
          </label>
        )}
        {value.role === 'alum' && (
          <label className="field">
            <span>Batch</span>
            <select className="input select" value={value.year ?? ''} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </>
  )
}

export function LevelSelect({ value, onChange }: { value: string; onChange: (level: string) => void }) {
  return (
    <select className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Pick one</option>
      {['College', 'Grad school'].map((g) => (
        <optgroup key={g} label={g}>
          {LEVELS.filter((l) => l.group === g).map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

export function HeadlineField({ value, set }: { value: ProfileDraft; set: (p: Partial<ProfileDraft>) => void }) {
  return (
    <label className="field">
      <span>Headline</span>
      <input
        className="input"
        value={value.headline}
        maxLength={140}
        placeholder="e.g. CS junior into design. Looking for a thesis group."
        onChange={(e) => set({ headline: e.target.value })}
      />
      <small>One line about you. It shows under your name.</small>
    </label>
  )
}

// Saves on pick. Edit profile and the first-time setup both use it.
export function PhotoField({ person, onChange, onError, size = 96 }: { person: FullPerson; onChange: (me: FullPerson) => void; onError: (msg: string) => void; size?: number }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function upload(data: string | null) {
    setBusy(true)
    try {
      const r = await api<{ user: FullPerson }>('/api/me/photo', { data })
      onChange(r.user)
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file?: File) {
    if (!file) return
    try {
      await upload(await toJpeg(file))
    } catch {
      onError('That photo did not work. Try another one.')
    }
  }

  return (
    <div className="photo-pick">
      <button type="button" className="photo-btn" onClick={() => input.current?.click()} disabled={busy} aria-label="Change photo">
        <Avatar person={person} size={size} />
        <i>
          <Camera weight="fill" />
        </i>
      </button>
      <div>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => input.current?.click()} disabled={busy}>
          {person.photo ? 'Change photo' : 'Add a photo'}
        </button>
        {person.photo && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => upload(null)} disabled={busy}>
            Remove
          </button>
        )}
        <small>A clear photo of your face helps people trust you.</small>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  )
}

export function SkillsField({ value, onChange, hint }: { value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const s = draft.trim().replace(/,$/, '')
    if (s && !value.some((x) => x.toLowerCase() === s.toLowerCase()) && value.length < 12) onChange([...value, s])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <div className="field">
      <span>Skills</span>
      <div className="skills-input">
        {value.map((s) => (
          <span key={s} className="tag is-plain">
            {s}
            <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((x) => x !== s))}>
              <X weight="bold" />
            </button>
          </span>
        ))}
        <input value={draft} maxLength={32} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={add} placeholder={value.length ? '' : 'e.g. Python, Debate, Resumes'} />
      </div>
      {hint && <small>{hint}</small>}
    </div>
  )
}
