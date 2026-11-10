import { useState, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { api } from '../lib/api'
import { load, save } from '../lib/storage'
import { COURSES, ROLES } from '../../shared/options.js'
import { Combo } from '../components/Combo'
import { OpenToPicker } from '../components/OpenTo'
import { LevelSelect, PhotoField, SkillsField } from '../components/ProfileFields'
import { LEGAL } from '../../shared/legal.js'
import type { FullPerson } from '../types'

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 70 }, (_, i) => THIS_YEAR + 5 - i)

// A profile is ready once it has a headline, an "Open to", and a skill. Until then, people finish setup before they see the app.
export const needsSetup = (me: FullPerson) => !me.headline || !me.openTo.length || !me.skills.length

// Three short steps: the basics, then a photo and a headline, then what you are open to.
// People who already have the basics start at the first step they have not done.
export function Onboarding({ me, onSaved, onSignOut }: { me: FullPerson | null; onSaved: (me: FullPerson) => void; onSignOut: () => void }) {
  const [step, setStep] = useState(() => (!me ? 1 : !me.headline ? 2 : 3))
  // Kept here, not read from the app, so a slow reload can not undo a step that just saved.
  const [person, setPerson] = useState(me)
  const [prefill] = useState(() => load<{ name?: string; role?: string } | null>('prefill', null))
  const [name, setName] = useState(prefill?.name ?? '')
  // The role picked on the landing page, so people do not pick it twice.
  const [role, setRole] = useState(ROLES.some((r) => r.id === prefill?.role) ? prefill!.role! : 'student')
  const [course, setCourse] = useState('')
  const [level, setLevel] = useState('')
  const [year, setYear] = useState('')
  const [adult, setAdult] = useState(false)
  const [agree, setAgree] = useState(false)
  const [headline, setHeadline] = useState(me?.headline ?? '')
  const [openTo, setOpenTo] = useState<string[]>(me?.openTo ?? [])
  const [skills, setSkills] = useState<string[]>(me?.skills ?? [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const faculty = role === 'faculty'
  const first = (person?.name ?? name).trim().split(/\s+/)[0]

  // Steps 2 and 3 send the whole profile, because the server fills in any field left out as empty.
  async function send(body: object) {
    setBusy(true)
    setError('')
    try {
      const r = await api<{ user: FullPerson }>('/api/me', body)
      setPerson(r.user)
      onSaved(r.user)
      return true
    } catch (err) {
      setError((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (step === 1) {
      if (name.trim().length < 2) return setError('Add your full name.')
      if (!course.trim()) return setError(faculty ? 'Add your department or office.' : 'Add your course.')
      if (role === 'student' && !level) return setError('Pick your year.')
      if (role === 'alum' && !year) return setError('Pick your batch.')
      if (!adult || !agree) return setError(`Check both boxes to join. BlueLink is only for people ${LEGAL.minAge} and older.`)
      const ok = await send({ name, role, course, level, year: year ? Number(year) : null, openTo: [], skills: [], adult, agree: LEGAL.version })
      if (!ok) return
      save('prefill', null)
      location.hash = '#/'
      setStep(2)
    } else if (step === 2) {
      if (headline.trim().length < 2) return setError('Add a headline.')
      if (await send({ ...person, headline })) setStep(3)
    } else {
      if (!openTo.length) return setError('Pick at least one.')
      if (!skills.length) return setError('Add at least one skill.')
      await send({ ...person, openTo, skills })
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
      <form className="onboard-body" onSubmit={submit} key={step} noValidate>
        <div className="onboard-steps" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= step ? 'is-on' : ''} />
          ))}
        </div>
        <p className="step">Step {step} of 3</p>

        {step === 1 && (
          <>
            <h1>{first ? `Hi, ${first}.` : 'Welcome to BlueLink.'}</h1>
            <p className="lead">Start with the basics.</p>
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
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && person && (
          <>
            <h1>Your profile</h1>
            <p className="lead">A photo and one line about you.</p>
            <div className="form-card is-flat">
              <PhotoField person={person} onChange={(u) => (setPerson(u), onSaved(u))} onError={setError} />
              <label className="field">
                <span>Headline</span>
                <input
                  className="input"
                  value={headline}
                  maxLength={140}
                  autoFocus
                  placeholder="e.g. CS junior into design. Looking for a thesis group."
                  onChange={(e) => setHeadline(e.target.value)}
                />
                <small>It shows under your name.</small>
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1>What are you open to?</h1>
            <p className="lead">This tells people it is OK to reach out.</p>
            <div className="form-card is-flat">
              <div className="field">
                <span>Open to</span>
                <OpenToPicker value={openTo} onChange={setOpenTo} />
              </div>
              <SkillsField value={skills} onChange={setSkills} hint="Press Enter after each one." />
              {error && <p className="form-error">{error}</p>}
              <div className="onboard-actions">
                <button type="button" className="btn btn-lg btn-ghost" onClick={() => (setError(''), setStep(2))} disabled={busy}>
                  Back
                </button>
                <button className="btn btn-primary btn-lg" disabled={busy}>
                  Finish
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
