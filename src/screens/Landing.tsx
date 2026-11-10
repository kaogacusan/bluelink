import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
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
import { SCHOOL, SIGNUP_ROLES, type SignupRole as Role } from '../../shared/school.js'
import { PLANS, earlyAccessOpen } from '../../shared/membership.js'
import { LEGAL, RULES } from '../../shared/legal.js'

const WHY = [
  { title: 'Exclusive access for Ateneans', text: 'Only Ateneans can join. Your posts stay inside BlueLink.' },
  { title: 'For people who want to network', text: 'Everyone here joined to meet people and find opportunities, not to scroll.' },
  { title: 'A safe space for networking', text: 'Reach out for internships, mentors, or intros. Report and block are on every profile.' },
]

const STEPS = [
  { title: 'Pick student or alumni', text: 'Sign in with a code sent to your email. We never show or keep your email.' },
  earlyAccessOpen()
    ? { title: 'Join free today', text: 'Early access is free on November 10 only. No payment, no code.' }
    : { title: 'Students pay the membership fee', text: `You get in right away. Full refund within ${LEGAL.refundDays} days. Alumni join free for now.` },
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

function finish(r: SignedIn, role: string) {
  save('prefill', { ...r.prefill, role })
  session.set(r.token)
}

// People who already have an account skip the student or alumni step.
type SignupRole = Omit<Role, 'id'> & { id: Role['id'] | 'signin' }
const SIGN_IN: SignupRole = { id: 'signin', label: 'Sign in', title: 'Sign in', domains: [], hint: 'Type your full email.' }

function SignInForm({ role, setRole }: { role: SignupRole | null; setRole: (r: SignupRole | null) => void }) {
  const config = useFetch<{ googleClientId: string }>('/api/config')
  const google = config.data?.googleClientId
  const [typed, setTyped] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Students type only the part before the @. A full email still works.
  const domain = role?.domains[0]
  const local = !!domain && !typed.includes('@')
  const email = (local ? `${typed.trim()}@${domain}` : typed.trim()).toLowerCase()

  // Start clean when the role changes, from the buttons here or from Sign in at the top.
  useEffect(() => {
    setTyped('')
    setSent(false)
    setError('')
  }, [role])

  async function withGoogle(accessToken: string) {
    if (!role) return
    setError('')
    try {
      finish(await api<SignedIn>('/api/auth/google', { accessToken, role: role.id }), role.id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function start(e?: FormEvent) {
    e?.preventDefault()
    if (!role) return
    setError('')
    // The server checks the school email, so people who already have an account can still sign in.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(role.hint)
    setBusy(true)
    try {
      const r = await api<{ devCode?: string }>('/api/auth/start', { email, role: role.id })
      setDevCode(r.devCode ?? null)
      setCode('')
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function verify(value: string) {
    if (!role) return
    setError('')
    setBusy(true)
    try {
      finish(await api<SignedIn>('/api/auth/verify', { email, code: value }), role.id)
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

  if (!role)
    return (
      <div className="l-form" id="signin">
        <p className="l-roles-label">Sign up as</p>
        <div className="l-roles">
          {SIGNUP_ROLES.map((r) => (
            <button key={r.id} className="btn btn-primary btn-lg" onClick={() => setRole(r)}>
              {r.label}
            </button>
          ))}
        </div>
        <p className="l-free">{earlyAccessOpen() ? 'Free for everyone who signs up today, November 10.' : 'Free for alumni for now.'}</p>
        {fine}
      </div>
    )

  if (sent)
    return (
      <div className="l-form" id="signin">
        <p className="l-form-title">Check your email</p>
        <p className="l-form-sub">
          We sent a 6-digit code to <b>{email}</b>. Not there? Check your spam folder.
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
          <button onClick={() => (setSent(false), setError(''))}>Use another email</button>
          <button onClick={() => start()} disabled={busy}>
            Send a new code
          </button>
        </div>
      </div>
    )

  return (
    <form className="l-form" id="signin" onSubmit={start} noValidate>
      <div className="l-form-head">
        <button type="button" className="l-back" onClick={() => setRole(null)} aria-label="Back">
          <ArrowLeft weight="bold" />
        </button>
        <p className="l-form-title">{role.title}</p>
      </div>
      {google && (
        <>
          <GoogleButton clientId={google} onToken={withGoogle} />
          <p className="l-or">or</p>
        </>
      )}
      <label className={`l-email-field ${local ? 'has-domain' : ''}`}>
        <input
          className="input"
          type={domain ? 'text' : 'email'}
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          placeholder={domain ? 'juan.delacruz' : role === SIGN_IN ? 'Your email' : 'you@gmail.com'}
          value={typed}
          style={local ? { paddingRight: `calc(${domain.length + 1}ch + 24px)` } : undefined}
          onChange={(e) => {
            const v = e.target.value
            // A browser that fills in the full school email: keep only the part before the @.
            setTyped(domain && v.toLowerCase().endsWith('@' + domain) ? v.slice(0, -(domain.length + 1)) : v)
          }}
          aria-label="Email"
        />
        {local && <span>@{domain}</span>}
      </label>
      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
        Continue with email <ArrowRight weight="bold" />
      </button>
      {error && <p className="form-error">{error}</p>}
      {fine}
    </form>
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
          Open for work
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
  const early = earlyAccessOpen()
  const [role, setRole] = useState<SignupRole | null>(null)
  return (
    <div className="landing">
      <div className="l-dark">
        <HeroGraph />
        <header className="l-top">
          <Logo size={30} />
          <button className="btn btn-ghost" onClick={() => setRole(SIGN_IN)}>
            Sign in
          </button>
        </header>

        <section className="l-hero">
          <div className="l-copy">
            <h1>
              Welcome to <em>Atenean Networking</em>
            </h1>
            <p className="l-sub">Find opportunities, network with each other. Exclusive for the {SCHOOL.short} Community.</p>
            <SignInForm role={role} setRole={setRole} />
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
          {early ? (
            <>
              <h2>Early access is free today.</h2>
              <p className="l-band-note">Sign up today and you get in. No payment, no code.</p>
            </>
          ) : (
            <>
              <h2>Both plans get everything.</h2>
              <p className="l-band-note">For students. Alumni join free for now.</p>
            </>
          )}
          <div className="l-plan-table">
            {early ? (
              <div className="l-plans l-plans-one">
                <p className="l-price">
                  <span>Early access, November 10 only</span>
                  <b>Free</b>
                </p>
              </div>
            ) : (
              <div className="l-plans">
                {PLANS.map((p) => (
                  <p key={p.id} className="l-price">
                    <span>{p.name}</span>
                    <b>₱{p.price}</b>
                  </p>
                ))}
              </div>
            )}
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
