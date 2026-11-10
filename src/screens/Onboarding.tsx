import { useState, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { api } from '../lib/api'
import { load, save } from '../lib/storage'
import { COURSES, ROLES } from '../../shared/options.js'
import { Combo } from '../components/Combo'
import { LevelSelect } from '../components/ProfileFields'
import { LEGAL } from '../../shared/legal.js'
import type { FullPerson } from '../types'

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 70 }, (_, i) => THIS_YEAR + 5 - i)

// One short screen. The name comes from Google or the email, so most people only pick a course and a year.
export function Onboarding({ onDone, onSignOut }: { onDone: (me: FullPerson) => void; onSignOut: () => void }) {
  const [prefill] = useState(() => load<{ name?: string; role?: string } | null>('prefill', null))
  const [name, setName] = useState(prefill?.name ?? '')
  // The role picked on the landing page, so people do not pick it twice.
  const [role, setRole] = useState(prefill?.role ?? 'student')
  const [course, setCourse] = useState('')
  const [level, setLevel] = useState('')
  const [year, setYear] = useState('')
  const [adult, setAdult] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const faculty = role === 'faculty'
  const first = name.trim().split(/\s+/)[0]

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Add your full name.')
    if (!adult || !agree) return setError(`Check both boxes to join. BlueLink is only for people ${LEGAL.minAge} and older.`)
    setBusy(true)
    setError('')
    try {
      const r = await api<{ user: FullPerson }>('/api/me', { name, role, course, level, year: year ? Number(year) : null, openTo: [], skills: [], adult, agree: LEGAL.version })
      save('prefill', null)
      location.hash = '#/'
      onDone(r.user)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="onboard">
      <header className="onboard-top">
        <Logo size={28} />
        <button className="btn btn-sm btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </header>
      <form className="onboard-body" onSubmit={submit}>
        <h1>{first ? `Hi, ${first}.` : 'Welcome to BlueLink.'}</h1>
        <p className="lead">Just the basics. You can add more later.</p>
        <div className="form-card is-flat">
          <label className="field">
            <span>Full name</span>
            <input className="input" value={name} maxLength={60} autoComplete="name" placeholder="e.g. Bea Santos" onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="field-row">
            <label className="field is-grow">
              <span>{faculty ? 'Department or office' : 'Course'}</span>
              <Combo
                value={course}
                options={faculty ? [] : COURSES}
                maxLength={80}
                autoFocus={!!name}
                placeholder={faculty ? 'e.g. Department of Economics' : 'Type to search, e.g. Comp Sci'}
                onChange={setCourse}
              />
            </label>
            {role === 'student' && (
              <label className="field">
                <span>Year</span>
                <LevelSelect value={level} onChange={setLevel} />
              </label>
            )}
            {role === 'alum' && (
              <label className="field">
                <span>Batch</span>
                <select className="input select" value={year} onChange={(e) => setYear(e.target.value)}>
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
          <label className="role-line">
            I am
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id === 'student' ? 'a student' : r.id === 'alum' ? 'alumni' : 'faculty or staff'}
                </option>
              ))}
            </select>
          </label>
          {/* Course and year are education details, which the Data Privacy Act treats as sensitive. So we ask, clearly, before we keep them. */}
          <div className="consent">
            <label className="check">
              <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
              <span>I am {LEGAL.minAge} or older.</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                I agree to the{' '}
                <a href="#/terms" target="_blank" rel="noreferrer">
                  Terms
                </a>{' '}
                and the{' '}
                <a href="#/privacy" target="_blank" rel="noreferrer">
                  Privacy Notice
                </a>
                . I let BlueLink use my name, role, course, and year to run my account and show my profile to members.
              </span>
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy || !adult || !agree}>
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}
