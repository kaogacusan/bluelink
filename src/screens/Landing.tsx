import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { ThumbsUp } from '@phosphor-icons/react/dist/csr/ThumbsUp'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { Logo } from '../components/Logo'
import { Avatar } from '../components/Avatar'
import { HeroGraph } from '../components/Network'
import { GoogleButton } from '../components/GoogleButton'
import { api, session, useFetch } from '../lib/api'
import { save } from '../lib/storage'
import { OPEN_TO } from '../../shared/options.js'
import { SCHOOL, isSchoolEmail } from '../../shared/school.js'
import { PLANS } from '../../shared/membership.js'
import { LEGAL, RULES } from '../../shared/legal.js'

const WHY = [
  { title: 'Exclusive access for Ateneans', text: 'Only Ateneans can join. Your posts stay inside BlueLink.' },
  { title: 'For people who want to network', text: 'Everyone here joined to meet people and find opportunities, not to scroll.' },
  { title: 'A safe space for networking', text: 'Reach out for internships, mentors, or intros. Report and block are on every profile.' },
]

const STEPS = [
  { title: 'Sign in with your Ateneo account', text: 'One tap with Google. We never show or keep your email.' },
  { title: 'Pay the membership fee', text: `You get in right away. Full refund within ${LEGAL.refundDays} days.` },
  { title: 'Post and connect', text: 'Find people by course, skill, or what they are open to, and say hi.' },
]

function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <label className="code-input">
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit code"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={`code-box ${i === value.length ? 'is-active' : ''} ${value[i] ? 'is-filled' : ''}`}>
          {value[i] ?? ''}
        </span>
      ))}
    </label>
  )
}

type SignedIn = { token: string; prefill?: { name: string } }

function finish(r: SignedIn) {
  save('prefill', r.prefill ?? null)
  session.set(r.token)
}

function SignInForm() {
  const config = useFetch<{ googleClientId: string }>('/api/config')
  const google = config.data?.googleClientId
  const [step, setStep] = useState<'start' | 'email' | 'code'>('start')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const showEmail = step === 'email' || (step === 'start' && config.data && !google)

  async function withGoogle(credential: string) {
    setError('')
    try {
      finish(await api<SignedIn>('/api/auth/google', { credential }))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function start(e?: FormEvent) {
    e?.preventDefault()
    setError('')
    if (!isSchoolEmail(email)) return setError(`Use your ${SCHOOL.short} email. It ends in @${SCHOOL.domains[0]}.`)
    setBusy(true)
    try {
      const r = await api<{ devCode?: string }>('/api/auth/start', { email })
      setDevCode(r.devCode ?? null)
      setCode('')
      setStep('code')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function verify(value: string) {
    setError('')
    setBusy(true)
    try {
      finish(await api<SignedIn>('/api/auth/verify', { email, code: value }))
    } catch (err) {
      setError((err as Error).message)
      setCode('')
      setBusy(false)
    }
  }

  const fine = (
    <p className="l-fine">
      By joining, you agree to the <a href="#/terms">Terms</a> and the <a href="#/privacy">Privacy Notice</a>.
    </p>
  )

  if (step === 'code')
    return (
      <div className="l-form" id="signin">
        <p className="l-form-title">Check your email</p>
        <p className="l-form-sub">
          We sent a 6-digit code to <b>{email}</b>.
        </p>
        <CodeInput
          value={code}
          disabled={busy}
          onChange={(v) => {
            setCode(v)
            if (v.length === 6) verify(v)
          }}
        />
        {devCode && (
          <p className="dev-code">
            Dev mode: your code is <b>{devCode}</b>
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="l-form-links">
          <button onClick={() => (setStep('email'), setError(''))}>Use another email</button>
          <button onClick={() => start()} disabled={busy}>
            Send a new code
          </button>
        </div>
      </div>
    )

  if (showEmail)
    return (
      <form className="l-form" id="signin" onSubmit={start} noValidate>
        <div className="l-email">
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={SCHOOL.example}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Ateneo email"
          />
          <button className="btn btn-primary btn-lg" disabled={busy}>
            Join BlueLink <ArrowRight weight="bold" />
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
        {fine}
        {google && (
          <div className="l-form-links">
            <button type="button" onClick={() => (setStep('start'), setError(''))}>
              Use Google instead
            </button>
          </div>
        )}
      </form>
    )

  return (
    <div className="l-form" id="signin">
      {google ? <GoogleButton clientId={google} onToken={withGoogle} /> : <div className="google-btn is-loading" />}
      {error && <p className="form-error">{error}</p>}
      {fine}
      <div className="l-form-links">
        <button onClick={() => (setStep('email'), setError(''))}>Use a sign-in code instead</button>
      </div>
    </div>
  )
}

// What it looks like: an "Open for work" post that only members can see, and two replies.
// It copies a real feed post, so people see the actual product, not a mockup.
function Preview() {
  const sam = { uid: 'demo-sam5', name: 'Sam Cruz', photo: null }
  const migs = { uid: 'demo-migs5', name: 'Migs Reyes', photo: null }
  const paolo = { uid: 'demo-paolo3', name: 'Paolo Lim', photo: null }
  return (
    <div className="l-visual" aria-hidden>
      <div className="card l-card">
        <div className="l-card-top">
          <Avatar person={sam} size={44} />
          <div>
            <b>Sam Cruz</b>
            <span>
              AB Communication &rsquo;29 · 2h
            </span>
          </div>
        </div>
        <p className="post-kind kind-work">
          <i className="l-live" /> Open for work
        </p>
        <p className="l-card-headline">I edit videos for orgs and small brands. Reels, event recaps, and interviews. Looking for paid projects this break.</p>
        <p className="l-card-stats">
          <span>
            <ThumbsUp weight="bold" /> 14
          </span>
          <span>
            <ChatCircle weight="bold" /> 2
          </span>
        </p>
        <div className="l-replies">
          <div className="l-reply">
            <Avatar person={migs} size={28} />
            <p>
              <b>Migs Reyes</b> Sent you a message. We need a reel for our launch.
            </p>
          </div>
          <div className="l-reply">
            <Avatar person={paolo} size={28} />
            <p>
              <b>Paolo Lim</b> Saving this. My team needs an editor next month.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="landing">
      <div className="l-dark">
        <HeroGraph />
        <header className="l-top">
          <Logo size={30} />
          <a className="btn btn-ghost" href="#signin">
            Sign in
          </a>
        </header>

        <section className="l-hero">
          <div className="l-copy">
            <h1>
              Welcome to <em>Atenean Networking</em>
            </h1>
            <p className="l-sub">Find opportunities, network with each other. Exclusive for the {SCHOOL.short} Community.</p>
            <SignInForm />
          </div>
          <Preview />
        </section>
        {/* The edge of a planet. Its night side is the rest of the page, so there is no seam. */}
        <div className="l-planet" aria-hidden />
      </div>

      <section className="l-steps is-why">
        <h2>Why members only?</h2>
        <ol>
          {WHY.map((s) => (
            <li key={s.title}>
              <span className="l-num" />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="l-band">
        <div className="l-band-inner">
          <h2>Both plans get everything.</h2>
          <div className="l-plan-table">
            <div className="l-plans">
              {PLANS.map((p) => (
                <p key={p.id} className="l-price">
                  <span>{p.name}</span>
                  <b>₱{p.price}</b>
                </p>
              ))}
            </div>
            <ul className="l-perks">
              {OPEN_TO.map((o) => (
                <li key={o.id}>
                  <Check weight="bold" />
                  {o.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="l-steps">
        <h2>How it works</h2>
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="l-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="l-rules" id="rules">
        <h2>Community rules</h2>
        <ul>
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <footer className="l-foot">
        <Logo size={22} />
        <p>Made by Ateneans. Not an official Ateneo de Manila University service.</p>
        <nav className="l-legal" aria-label="Legal">
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
        </nav>
      </footer>
    </div>
  )
}
