import { useState, type FormEvent } from 'react'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { Logo } from '../components/Logo'
import { api, useFetch } from '../lib/api'
import { PLANS, planById } from '../../shared/membership.js'
import { LEGAL } from '../../shared/legal.js'
import type { Membership } from '../types'

type JoinData = { membership: Membership; gcash: { name: string; number: string }; dev: boolean }

const PERKS = [
  'Only members see your posts. Nothing goes on the public internet.',
  'Everyone here wants to network, so people reply.',
  'Reach out for internships, mentors, or intros. No one thinks it is weird.',
]

const day = (ts: number) => new Date(ts).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })

// The members-only door: pay for 1 year or lifetime by GCash, or use a code.
export function Join({ firstName, onJoined, onSignOut }: { firstName: string; onJoined: () => void; onSignOut: () => void }) {
  const { data } = useFetch<JoinData>('/api/membership')
  const [planId, setPlanId] = useState(PLANS[0].id)
  const [ref, setRef] = useState('')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const m = data?.membership
  const expired = !!m && !m.active && m.until > 0 && m.status !== 'rejected'
  const rejected = m?.status === 'rejected'
  const gcash = data?.gcash
  const refDigits = ref.replace(/\D/g, '')
  const plan = planById(planId)

  async function pay(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/membership/pay', { ref, plan: plan.id })
      onJoined()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  async function useCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setCodeError('')
    try {
      await api('/api/membership/code', { code })
      onJoined()
    } catch (err) {
      setCodeError((err as Error).message)
      setBusy(false)
    }
  }

  function copy() {
    navigator.clipboard?.writeText(gcash!.number.replace(/\s/g, '')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div className="onboard">
      <header className="onboard-top">
        <Logo size={28} />
        <button className="btn btn-sm btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      <div className="onboard-body join">
        <h1>{expired ? 'Renew your membership' : `Last step${firstName ? `, ${firstName}` : ''}.`}</h1>
        <p className="lead">
          {expired ? `Your membership ended on ${day(m!.until)}. ` : ''}
          BlueLink is members only. Pick 1 year or lifetime. Both get the same app.
        </p>

        <ul className="perks">
          {PERKS.map((p) => (
            <li key={p}>
              <Check weight="bold" /> {p}
            </li>
          ))}
        </ul>

        {rejected && (
          <p className="alert">
            We could not find your GCash payment with reference {m!.ref}. Check the number on your receipt and try again.
          </p>
        )}

        <section className="card pay-card">
          <h2>Pay with GCash</h2>
          <div className="picker plan-picker" role="radiogroup" aria-label="Plan">
            {PLANS.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={p.id === plan.id} className={`pick ${p.id === plan.id ? 'is-on' : ''}`} onClick={() => setPlanId(p.id)}>
                {p.name} <b>₱{p.price}</b>
              </button>
            ))}
          </div>
          {gcash?.number ? (
            <form onSubmit={pay}>
              <ol className="pay-steps">
                <li>
                  <span className="pay-num">1</span>
                  <div>
                    <p>
                      Send <b>₱{plan.price}</b> to this GCash number.
                    </p>
                    <div className="gcash">
                      <div>
                        <b>{gcash.number}</b>
                        {gcash.name && <span>{gcash.name}</span>}
                      </div>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={copy}>
                        {copied ? <Check weight="bold" /> : <Copy weight="bold" />} {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </li>
                <li>
                  <span className="pay-num">2</span>
                  <div>
                    <p>Type the reference number from your GCash receipt.</p>
                    <input
                      className="input ref-input"
                      inputMode="numeric"
                      value={ref}
                      maxLength={24}
                      placeholder="e.g. 1234 567 891234"
                      onChange={(e) => setRef(e.target.value.replace(/[^\d ]/g, ''))}
                      aria-label="GCash reference number"
                    />
                  </div>
                </li>
              </ol>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-lg btn-block" disabled={busy || refDigits.length < 10}>
                I paid ₱{plan.price}. Let me in.
              </button>
              <p className="fine pay-fine">
                You get in right away. We check every payment within a day. Changed your mind? Full refund within {LEGAL.refundDays} days. By paying, you agree to the{' '}
                <a href="#/terms">Terms</a>.
              </p>
            </form>
          ) : (
            <p className="fine">GCash payments open soon. If you have a voucher or founding member code, use it below.</p>
          )}
        </section>

        <div className="code-box-row">
          {showCode ? (
            <form className="code-form" onSubmit={useCode}>
              <input className="input" value={code} maxLength={40} autoFocus placeholder="e.g. ACD-FGH" onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="Voucher or founding member code" />
              <button className="btn btn-outline" disabled={busy || code.trim().length < 3}>
                Use code
              </button>
            </form>
          ) : (
            <button className="link-btn" onClick={() => setShowCode(true)}>
              Have a code?
            </button>
          )}
          {codeError && <p className="form-error">{codeError}</p>}
          {data?.dev && <p className="dev-code">Dev mode: try the code <b>FOUNDERS</b>.</p>}
        </div>
      </div>
    </div>
  )
}
