import { COURSES, LEVELS, ROLES } from '../../shared/options.js'
import { Combo } from './Combo'

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
