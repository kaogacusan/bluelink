import { useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { useLive } from '../lib/live'
import { href } from '../lib/router'
import { ago } from '../lib/format'
import { REPORT_REASONS } from '../../shared/options.js'
import { Outreach } from './Outreach'
import type { Person } from '../types'

type AdminData = {
  stats: { people: number; members: number; pending: number; earned: number }
  payments: { id: string; ref: string; amount: number; at: number; status: 'pending' | 'approved' | 'rejected'; user: Person | null }[]
  codes: { code: string; max: number; used: number; days: number | null; lifetime?: boolean; createdAt: number }[]
  gcash: { name: string; number: string }
  reports: { at: number; reason: string; note: string; from: Person | null; against: Person | null; post: string | null }[]
}

const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id

function GcashForm({ start, onSaved }: { start: AdminData['gcash']; onSaved: () => void }) {
  const { toast } = useApp()
  const [name, setName] = useState(start.name)
  const [number, setNumber] = useState(start.number)
  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await api('/api/admin/settings', { gcashName: name, gcashNumber: number })
      toast('Saved.')
      onSaved()
    } catch (err) {
      toast((err as Error).message)
    }
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <input className="input" value={number} placeholder="GCash number" onChange={(e) => setNumber(e.target.value)} aria-label="GCash number" />
      <input className="input" value={name} placeholder="Name on GCash" onChange={(e) => setName(e.target.value)} aria-label="Name on GCash" />
      <button className="btn btn-primary">Save</button>
    </form>
  )
}

function AdminTabs({ tab }: { tab?: 'outreach' }) {
  return (
    <nav className="admin-tabs" aria-label="Admin">
      <a href={href.admin} className={!tab ? 'is-on' : ''} aria-current={!tab ? 'page' : undefined}>
        Overview
      </a>
      <a href={href.outreach} className={tab === 'outreach' ? 'is-on' : ''} aria-current={tab === 'outreach' ? 'page' : undefined}>
        Org outreach
      </a>
    </nav>
  )
}

export function Admin({ tab }: { tab?: 'outreach' }) {
  const { isAdmin } = useApp()
  if (!isAdmin) return <p className="empty">Admins only.</p>
  return (
    <>
      <AdminTabs tab={tab} />
      {tab === 'outreach' ? <Outreach /> : <Overview />}
    </>
  )
}

function Overview() {
  const { toast } = useApp()
  const { data, reload } = useFetch<AdminData>('/api/admin')
  const [code, setCode] = useState('')
  const [max, setMax] = useState('50')
  const [count, setCount] = useState('50')
  const [plan, setPlan] = useState<'life' | 'year'>('life')
  const [cards, setCards] = useState<{ codes: string[]; plan: 'life' | 'year' }>({ codes: [], plan: 'life' })
  useLive((e) => e.type === 'admin' && reload())

  if (!data) return <div className="card skeleton" />

  async function act(path: string, done: string) {
    try {
      await api(path, {})
      toast(done)
      reload()
    } catch (err) {
      toast((err as Error).message)
    }
  }

  async function addCode(e: FormEvent) {
    e.preventDefault()
    try {
      await api('/api/admin/codes', { code, max: Number(max), kind: 'year' })
      setCode('')
      reload()
    } catch (err) {
      toast((err as Error).message)
    }
  }

  // Voucher cards for the booth: one code per card, Lifetime (₱250) or 1 year (₱99).
  async function makeCards(e: FormEvent) {
    e.preventDefault()
    try {
      const r = await api<{ codes: string[]; plan: 'life' | 'year' }>('/api/admin/codes/batch', { count: Number(count), plan })
      setCards({ codes: r.codes, plan: r.plan })
      reload()
    } catch (err) {
      toast((err as Error).message)
    }
  }

  // One code per line with its card: "ACD-FGH, lifetime". The booth kit (npm run cards) prints the matching front.
  function saveCards() {
    const card = cards.plan === 'life' ? 'lifetime' : 'founding'
    const text = cards.codes.map((c) => `${c}, ${card}`).join('\n') + '\n'
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `bluelink-voucher-codes-${card}-${cards.codes.length}.txt` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const { stats } = data

  return (
    <>
      <header className="page-head">
        <h1>Admin</h1>
        <p>Check payments, make founding codes, and see reports.</p>
      </header>

      <div className="stats">
        <div className="card stat">
          <b>{stats.members}</b>
          <span>Active members</span>
        </div>
        <div className="card stat">
          <b>{stats.people}</b>
          <span>Signed up</span>
        </div>
        <div className={`card stat ${stats.pending ? 'is-hot' : ''}`}>
          <b>{stats.pending}</b>
          <span>Payments to check</span>
        </div>
        <div className="card stat">
          <b>₱{stats.earned.toLocaleString()}</b>
          <span>Checked and paid</span>
        </div>
      </div>

      <section className="card section">
        <h2>Payments</h2>
        <p className="fine">Open GCash and look for each reference number. Approve it if you find it. Reject it if you do not. Rejected people lose access.</p>
        {!data.payments.length && <p className="admin-empty">No payments yet.</p>}
        <div className="admin-list">
          {data.payments.map((p) => (
            <div key={p.id} className="admin-row">
              {p.user ? (
                <a href={href.user(p.user.uid)} className="row-who">
                  <Avatar person={p.user} size={36} />
                  <div>
                    <b>{p.user.name}</b>
                    <span>
                      Ref <span className="mono">{p.ref}</span> · ₱{p.amount} · {ago(p.at)}
                    </span>
                  </div>
                </a>
              ) : (
                <span className="row-who">Deleted account · Ref {p.ref}</span>
              )}
              {p.status === 'pending' ? (
                <div className="admin-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => act(`/api/admin/payments/${p.id}/approve`, 'Approved.')}>
                    Approve
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => act(`/api/admin/payments/${p.id}/reject`, 'Rejected. They lost access.')}>
                    Reject
                  </button>
                </div>
              ) : (
                <span className={`pay-status is-${p.status}`}>{p.status === 'approved' ? 'Approved' : 'Rejected'}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card section">
        <h2>Voucher cards</h2>
        <p className="fine">Makes one-use codes for the printed cards sold at the booth: Lifetime (₱250) or 1 year (₱99). Save the file and print it with the booth kit. Keep it private: each code is money.</p>
        <form className="admin-form" onSubmit={makeCards}>
          <select className="input" value={plan} onChange={(e) => setPlan(e.target.value as 'life' | 'year')} aria-label="Which card">
            <option value="life">Lifetime</option>
            <option value="year">1 year</option>
          </select>
          <input className="input is-num" type="number" min={1} max={500} value={count} onChange={(e) => setCount(e.target.value)} aria-label="How many cards" />
          <button className="btn btn-primary">Make codes</button>
          {cards.codes.length > 0 && (
            <button type="button" className="btn btn-outline" onClick={saveCards}>
              Save {cards.codes.length} {cards.plan === 'life' ? 'lifetime' : '1-year'} codes
            </button>
          )}
        </form>
      </section>

      <section className="card section">
        <h2>Founding member codes</h2>
        <p className="fine">A code lets people in free for one year. Give it to the first members you invite.</p>
        <form className="admin-form" onSubmit={addCode}>
          <input className="input" value={code} placeholder="e.g. FOUNDERS" onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="New code" />
          <input className="input is-num" type="number" min={1} max={1000} value={max} onChange={(e) => setMax(e.target.value)} aria-label="How many people can use it" />
          <button className="btn btn-primary" disabled={code.trim().length < 3}>
            Add code
          </button>
        </form>
        <div className="admin-list">
          {data.codes.map((c) => (
            <div key={c.code} className="admin-row">
              <div className="row-who">
                <div>
                  <b className="mono">{c.code}</b>
                  <span>
                    {c.used} of {c.max} used · {c.lifetime ? 'Lifetime' : c.days === 365 ? '1 year' : `${c.days} days`}
                  </span>
                </div>
              </div>
              <button className="btn btn-sm btn-ghost is-danger-text" onClick={() => act(`/api/admin/codes/${encodeURIComponent(c.code)}/delete`, 'Code deleted.')}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card section">
        <h2>GCash details</h2>
        <p className="fine">People send their payment here. They see this on the pay screen.</p>
        <GcashForm start={data.gcash} onSaved={reload} />
      </section>

      <section className="card section">
        <h2>Reports</h2>
        {!data.reports.length && <p className="admin-empty">No reports. Good.</p>}
        <div className="admin-list">
          {data.reports.map((r, i) => (
            <div key={i} className="report">
              <p>
                <b>{reasonLabel(r.reason)}</b> · {ago(r.at)}
              </p>
              <p className="fine">
                {r.from?.name ?? 'Someone'} reported{' '}
                {r.against ? <a href={href.user(r.against.uid)}>{r.against.name}</a> : 'a deleted account'}
                {r.post ? `: “${r.post}”` : '.'}
              </p>
              {r.note && <p className="report-note">{r.note}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
