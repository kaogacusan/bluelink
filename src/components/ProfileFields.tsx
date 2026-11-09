import { ROLES, SCHOOLS } from '../../shared/options.js'

export interface ProfileDraft {
  name: string
  role: string
  school: string
  course: string
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
              {r.id === 'student' ? 'A student' : r.id === 'alum' ? 'An alum' : 'Faculty or staff'}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>School</span>
        <select className="input select" value={value.school} onChange={(e) => set({ school: e.target.value })}>
          <option value="">Pick your school</option>
          {SCHOOLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field is-grow">
          <span>{faculty ? 'Department or office' : 'Course'}</span>
          <input
            className="input"
            value={value.course}
            maxLength={80}
            placeholder={faculty ? 'e.g. Department of Economics' : 'e.g. BS Computer Science'}
            onChange={(e) => set({ course: e.target.value })}
          />
        </label>
        {!faculty && (
          <label className="field">
            <span>{value.role === 'alum' ? 'Batch' : 'Graduating'}</span>
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
