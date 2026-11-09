import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { Handshake } from '@phosphor-icons/react/dist/csr/Handshake'
import { LockSimple } from '@phosphor-icons/react/dist/csr/LockSimple'
import { Logo } from '../components/Logo'
import { Avatar } from '../components/Avatar'
import { HeroGraph } from '../components/Network'
import { GoogleButton } from '../components/GoogleButton'
import { api, session, useFetch } from '../lib/api'
import { save } from '../lib/storage'
import { OPEN_TO } from '../../shared/options.js'
import { SCHOOL, isSchoolEmail } from '../../shared/school.js'
import { MEMBERSHIP } from '../../shared/membership.js'
import { LEGAL, RULES } from '../../shared/legal.js'

const WHY = [
  { title: 'Your posts stay in the room', text: 'Only Ateneans who joined can see them. Nothing goes on Facebook or LinkedIn.' },
  { title: 'Everyone here chose to join', text: 'Members pay to be here, so they come to connect, not to scroll.' },
  { title: 'Safe to ask', text: 'Say you are open for work, need a mentor, or want an intro. Report and block are on every profile.' },
]

const STEPS = [
  { title: 'Sign in with your Ateneo account', text: 'One tap with Google. We never show or keep your email.' },
  { title: `Pay ₱${MEMBERSHIP.price} with GCash`, text: `You get in right away. It covers ${MEMBERSHIP.days} days, about one semester. Full refund within ${LEGAL.refundDays} days.` },
  { title: 'Post, ask, and connect', text: 'Find people by course, skill, or what they are open to, and say hi.' },
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
  const config = useFetch<{ googleClientId: string; price: number }>('/api/config')
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
      {MEMBERSHIP.label}. {LEGAL.minAge}+ only. By joining, you agree to the <a href="#/terms">Terms</a> and the <a href="#/privacy">Privacy Notice</a>.
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
function Preview() {
  const sam = { uid: 'demo-sam', name: 'Sam Cruz', photo: null }
  const migs = { uid: 'demo-migs', name: 'Migs Reyes', photo: null }
  const paolo = { uid: 'demo-paolo', name: 'Paolo Lim', photo: null }
  return (
    <div className="l-visual" aria-hidden>
      <div className="card l-card">
        <i className="plate is-tl" />
        <i className="plate is-tr" />
        <i className="plate is-bl" />
        <i className="plate is-br" />
        <p className="l-card-tag">
          <span>Example post</span>
          <span>Members only</span>
        </p>
        <div className="l-card-top">
          <Avatar person={sam} size={52} />
          <div>
            <b>Sam Cruz</b>
            <span>AB Communication &rsquo;29 · 2h</span>
          </div>
        </div>
        <p className="post-kind">
          <Handshake weight="bold" /> Open for work
        </p>
        <p className="l-card-headline">I edit videos for orgs and small brands. Reels, event recaps, and interviews. Looking for paid projects this break.</p>
        <div className="l-replies">
          <div className="l-reply">
            <Avatar person={migs} size={30} />
            <p>
              <b>Migs Reyes</b> Sent you a message. We need a reel for our launch.
            </p>
          </div>
          <div className="l-reply">
            <Avatar person={paolo} size={30} />
            <p>
              <b>Paolo Lim</b> Saving this. My team needs an editor next month.
            </p>
          </div>
        </div>
      </div>
      <p className="l-lock">
        <LockSimple weight="bold" /> Only BlueLink members can see this post.
      </p>
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
            <p className="l-kicker">
              <i /> Members only · For {SCHOOL.people}
            </p>
            <h1>
              The private network where asking is <em>normal.</em>
            </h1>
            <p className="l-sub">Ask for work, find a mentor, or offer what you are good at. Only {SCHOOL.people} who join can see your posts.</p>
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
          <p className="l-price">
            <b>₱{MEMBERSHIP.price}</b>
            <span>per semester</span>
          </p>
          <div>
            <h2>One price. Everyone gets the same thing.</h2>
            <p>No badges, no ranks, no premium tier. The price keeps the room small and serious.</p>
            <ul className="tags is-lg">
              {OPEN_TO.map((o) => (
                <li key={o.id} className="tag">
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
        <p className="l-coords">14.6395° N · 121.0781° E</p>
      </footer>
    </div>
  )
}
