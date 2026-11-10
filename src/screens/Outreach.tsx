import { useState, type FormEvent } from 'react'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Modal } from '../components/Modal'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { useLive } from '../lib/live'
import { load, save } from '../lib/storage'
import { ago } from '../lib/format'

type OrgRow = {
  id: string
  name: string
  short: string
  cluster: string
  email: string
  page: string
  tier: 1 | 2
  why: string
  owner: string
  status: string
  sentOn: string
  note: string
  at: number
  by: string
  followUp: string
}
type Template = { subject: string; body: string }
type Data = { team: string[]; statuses: string[]; clusters: string[]; template: Template; orgs: OrgRow[] }

const LANES: [string, string, string[]][] = [
  ['todo', 'To email', ['Not sent']],
  ['waiting', 'Waiting on them', ['Sent', 'Followed up']],
  ['done', 'Answered', ['Yes', 'No', 'No reply']],
]
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-')
const first = (name: string) => name.split(' ')[0]
const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
const label = (o: OrgRow) => o.short || o.name
const isOpen = (o: OrgRow) => o.status === 'Not sent'
const manilaToday = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
const isDue = (o: OrgRow) => !!o.followUp && o.followUp <= manilaToday()
const pageUrl = (o: OrgRow) => (/^https?:\/\//.test(o.page) ? o.page : '')

// "[org]" and "[your name]" fill in by themselves.
const fill = (text: string, o: OrgRow) => text.replaceAll('[org]', label(o)).replaceAll('[your name]', o.owner)
const gmailUrl = (o: OrgRow, t: Template) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(o.email)}&su=${encodeURIComponent(fill(t.subject, o))}&body=${encodeURIComponent(fill(t.body, o))}`

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function Who({ name }: { name: string }) {
  return (
    <span className="o-who" title={name}>
      {initials(name)}
    </span>
  )
}

function Pill({ status }: { status: string }) {
  return <span className={`o-pill is-${slug(status)}`}>{status}</span>
}

function Bar({ orgs, statuses }: { orgs: OrgRow[]; statuses: string[] }) {
  const n = orgs.length || 1
  return (
    <span className="o-bar">
      {statuses.map((s) => {
        const c = orgs.filter((o) => o.status === s).length
        return c ? <i key={s} className={`is-${slug(s)}`} style={{ width: `${(c / n) * 100}%` }} title={`${s}: ${c}`} /> : null
      })}
    </span>
  )
}

export function Outreach() {
  const { me, toast } = useApp()
  const { data, setData, reload } = useFetch<Data>('/api/admin/outreach')
  const [who, setWho] = useState<string | null>(() => load<string | null>('outreach:who', null))
  const [by, setBy] = useState<'cluster' | 'status'>('cluster')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  useLive((e) => e.type === 'admin' && reload())

  if (!data) return <div className="card skeleton" />

  const { team, statuses, clusters, template, orgs } = data
  // First visit: show your own orgs if your name is on the team.
  const mine = team.find((n) => first(n).toLowerCase() === first(me.name).toLowerCase())
  const person = who === null ? mine || '' : who
  const pick = (name: string) => {
    setWho(name)
    save('outreach:who', name)
  }

  const shown = orgs.filter((o) => !person || o.owner === person)
  const term = q.trim().toLowerCase()
  const list = shown.filter((o) => !term || `${o.name} ${o.short} ${o.cluster} ${o.email}`.toLowerCase().includes(term))
  const sent = shown.filter((o) => !isOpen(o)).length
  const due = shown.filter((o) => o.status === 'Sent' && isDue(o))
  const open = orgs.find((o) => o.id === openId) || null

  const boxes =
    by === 'status'
      ? LANES.map(([key, name, sts]) => ({ key, name, orgs: list.filter((o) => sts.includes(o.status)), lane: true }))
      : [...new Set(list.map((o) => o.cluster))]
          .sort((a, b) => (clusters.includes(a) ? clusters.indexOf(a) : 99) - (clusters.includes(b) ? clusters.indexOf(b) : 99))
          .map((c) => ({ key: c, name: c, orgs: list.filter((o) => o.cluster === c), lane: false }))

  async function patch(o: OrgRow, body: Partial<OrgRow>, done?: string) {
    setData({ ...data!, orgs: orgs.map((x) => (x.id === o.id ? { ...x, ...body } : x)) })
    try {
      await api(`/api/admin/outreach/${o.id}`, body)
      if (done) toast(done)
      reload()
    } catch (err) {
      toast((err as Error).message)
      reload()
    }
  }

  // Opens Gmail with the email filled in. No email yet: copy the message and open their page.
  async function send(o: OrgRow) {
    if (o.email) return void window.open(gmailUrl(o, template), '_blank', 'noopener')
    const ok = await copy(fill(template.body, o))
    toast(ok ? 'Message copied. Paste it in their inbox.' : 'Could not copy. Open the org to copy it.')
    if (pageUrl(o)) window.open(pageUrl(o), '_blank', 'noopener')
  }

  return (
    <>
      <header className="page-head is-row o-head">
        <div>
          <h1>{person ? (person === mine ? 'Your orgs' : `${first(person)}’s orgs`) : 'Every org'}</h1>
          <p>Email every org. Mark it when you send it.</p>
        </div>
        <div className="o-head-act">
          <select className="input select" value={person} onChange={(e) => pick(e.target.value)} aria-label="Whose orgs">
            <option value="">Everyone</option>
            {team.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={() => setAdding(true)}>
            <Plus weight="bold" /> Add org
          </button>
        </div>
      </header>

      <section className="card o-hero">
        <div className="o-hero-n">
          <b>
            {sent}
            <small>/{shown.length}</small>
          </b>
          <span>emailed</span>
        </div>
        <div className="o-hero-mid">
          <Bar orgs={shown} statuses={statuses} />
          <p className="o-legend">
            {statuses.map((s) => {
              const c = shown.filter((o) => o.status === s).length
              return c ? (
                <span key={s}>
                  <i className={`o-dot is-${slug(s)}`} />
                  {s} <b>{c}</b>
                </span>
              ) : null
            })}
          </p>
          <div className="o-people">
            {team.map((n) => {
              const xs = orgs.filter((o) => o.owner === n)
              return (
                <button key={n} className={`o-person ${person === n ? 'is-on' : ''}`} onClick={() => pick(person === n ? '' : n)}>
                  <Who name={n} />
                  <span>{first(n)}</span>
                  <b>
                    {xs.filter((o) => !isOpen(o)).length}/{xs.length}
                  </b>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {due.length > 0 && (
        <div className="o-banner">
          <Clock weight="bold" />
          <span>
            <b>Follow up today:</b>{' '}
            {due.map((o) => (
              <button key={o.id} className="o-chipbtn" onClick={() => setOpenId(o.id)}>
                {label(o)}
              </button>
            ))}
          </span>
        </div>
      )}

      <section className="card o-mail">
        <div>
          <span className="o-kicker">The email</span>
          <b>{template.subject}</b>
          <p>{template.body.split('\n').find((l) => l.trim() && !/^hi\b/i.test(l.trim()))}</p>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setEditing(true)}>
          <PencilSimple weight="bold" /> Edit
        </button>
      </section>

      <div className="o-tools">
        <div className="seg is-sm" role="group" aria-label="Group by">
          <button className={by === 'cluster' ? 'is-on' : ''} onClick={() => setBy('cluster')}>
            Cluster
          </button>
          <button className={by === 'status' ? 'is-on' : ''} onClick={() => setBy('status')}>
            Status
          </button>
        </div>
        <label className="search o-search">
          <MagnifyingGlass weight="bold" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an org" aria-label="Find an org" />
        </label>
      </div>

      {list.length ? (
        <div className={`o-boxes ${by === 'status' ? 'is-lanes' : ''}`}>
          {boxes.map((b) => (
            <section key={b.key} className={`card o-box ${b.lane ? `is-${b.key}` : ''}`}>
              <header className="o-box-head">
                <h2>{b.name.replace(/ Cluster$/, '')}</h2>
                <span className="section-count">{b.lane ? b.orgs.length : `${b.orgs.filter((o) => !isOpen(o)).length}/${b.orgs.length}`}</span>
                {!b.lane && <Bar orgs={b.orgs} statuses={statuses} />}
              </header>
              {b.orgs.length ? (
                <div className="o-grid">
                  {b.orgs.map((o) => (
                    <Tile key={o.id} o={o} showOwner={!person} onOpen={() => setOpenId(o.id)} onSend={() => send(o)} onStatus={(s) => patch(o, { status: s }, `${label(o)}: ${s}`)} />
                  ))}
                </div>
              ) : (
                <p className="admin-empty">Nothing here.</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="empty">{q ? 'No orgs match.' : 'No orgs yet.'}</p>
      )}

      {open && <OrgSheet o={open} data={data} onClose={() => setOpenId(null)} onPatch={patch} onSend={() => send(open)} onDeleted={reload} />}
      {editing && <TemplateSheet start={template} onClose={() => setEditing(false)} onSaved={reload} />}
      {adding && <AddSheet data={data} onClose={() => setAdding(false)} onSaved={reload} />}
    </>
  )
}

function Tile({ o, showOwner, onOpen, onSend, onStatus }: { o: OrgRow; showOwner: boolean; onOpen: () => void; onSend: () => void; onStatus: (s: string) => void }) {
  const due = o.status === 'Sent' && isDue(o)
  const canSend = !!(o.email || pageUrl(o))
  return (
    <article className={`o-tile is-${slug(o.status)} ${due ? 'is-due' : ''}`} tabIndex={0} role="button" aria-label={o.name} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen()}>
      <header className="o-tile-top">
        <Pill status={o.status} />
        {o.tier === 1 && <span className="o-top">Top pick</span>}
        {showOwner && o.owner && <Who name={o.owner} />}
      </header>
      <b className="o-tile-name">{label(o)}</b>
      {o.short && <small className="o-tile-sub">{o.name}</small>}
      {o.status === 'Sent' && o.followUp && (
        <span className="o-tile-fu">
          <Clock weight="bold" /> Follow up {due ? 'now' : o.followUp.slice(5).replace('-', '/')}
        </span>
      )}
      {!o.email && isOpen(o) && <span className="o-tile-fu">{canSend ? 'No email. Use their page.' : 'No email or page yet.'}</span>}
      {(isOpen(o) || due) && (
        <footer className="o-tile-act" onClick={(e) => e.stopPropagation()}>
          {canSend && (
            <button className="o-btn is-go" onClick={onSend} title={o.email ? 'Open Gmail with the email filled in' : 'Copy the message and open their page'}>
              {o.email ? <EnvelopeSimple weight="bold" /> : <ArrowSquareOut weight="bold" />} {o.email ? 'Email' : 'Page'}
            </button>
          )}
          <button className="o-btn" onClick={() => onStatus(due ? 'Followed up' : 'Sent')} title={due ? 'I followed up' : 'I sent it'}>
            <Check weight="bold" /> {due ? 'Done' : 'Sent'}
          </button>
        </footer>
      )}
    </article>
  )
}

function OrgSheet({
  o,
  data,
  onClose,
  onPatch,
  onSend,
  onDeleted,
}: {
  o: OrgRow
  data: Data
  onClose: () => void
  onPatch: (o: OrgRow, body: Partial<OrgRow>, done?: string) => Promise<void>
  onSend: () => void
  onDeleted: () => void
}) {
  const { toast } = useApp()
  const [email, setEmail] = useState(o.email)
  const [page, setPage] = useState(o.page)
  const [note, setNote] = useState(o.note)
  const [peek, setPeek] = useState(false)
  const changed = email !== o.email || page !== o.page || note !== o.note

  async function copyMsg() {
    toast((await copy(`${fill(data.template.subject, o)}\n\n${fill(data.template.body, o)}`)) ? 'Email copied.' : 'Could not copy.')
  }
  async function remove() {
    try {
      await api(`/api/admin/outreach/${o.id}/delete`, {})
      toast('Removed.')
      onClose()
      onDeleted()
    } catch (err) {
      toast((err as Error).message)
    }
  }

  return (
    <Modal title={o.name} onClose={onClose} wide>
      <div className="o-meta">
        <Pill status={o.status} />
        <span>{o.cluster}</span>
        {o.tier === 1 && <span className="o-top">Top pick</span>}
        {o.status === 'Sent' && o.followUp && <span>Follow up {o.followUp}</span>}
      </div>
      {o.why && <p className="fine">{o.why}</p>}

      <ol className="o-steps">
        <li>
          <b>Send the email</b>
          <div className="o-row">
            {(o.email || pageUrl(o)) && (
              <button className="btn btn-sm btn-primary" onClick={onSend}>
                {o.email ? <EnvelopeSimple weight="bold" /> : <ArrowSquareOut weight="bold" />} {o.email ? 'Open in Gmail' : 'Copy and open page'}
              </button>
            )}
            <button className="btn btn-sm btn-outline" onClick={copyMsg}>
              <Copy weight="bold" /> Copy email
            </button>
            {pageUrl(o) && (
              <a className="btn btn-sm btn-ghost" href={pageUrl(o)} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut weight="bold" /> Page
              </a>
            )}
            <button className="btn btn-sm btn-ghost" onClick={() => setPeek(!peek)}>
              {peek ? 'Hide' : 'See'} the email
            </button>
          </div>
          {peek && (
            <div className="o-preview">
              <b>{fill(data.template.subject, o)}</b>
              <p>{fill(data.template.body, o)}</p>
            </div>
          )}
        </li>
        <li>
          <b>Status</b>
          <div className="o-status">
            {data.statuses.map((s) => (
              <button key={s} className={s === o.status ? 'is-on' : ''} onClick={() => onPatch(o, { status: s }, `${label(o)}: ${s}`)}>
                <i className={`o-dot is-${slug(s)}`} />
                {s}
              </button>
            ))}
          </div>
        </li>
        <li>
          <b>Details</b>
          <div className="o-form">
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={email} placeholder="org@ateneo.edu" onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Page</span>
              <input className="input" value={page} placeholder="facebook.com/…" onChange={(e) => setPage(e.target.value)} />
            </label>
            <label className="field o-wide">
              <span>Notes</span>
              <textarea className="input" rows={2} value={note} placeholder="Who replied, what they said, next step" onChange={(e) => setNote(e.target.value)} />
            </label>
            <label className="field">
              <span>Who emails them</span>
              <select className="input select" value={o.owner} onChange={(e) => onPatch(o, { owner: e.target.value }, `Moved to ${first(e.target.value)}.`)}>
                {data.team.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        </li>
      </ol>

      <div className="modal-actions">
        <span className="count">{o.at ? `Changed by ${o.by ? first(o.by) : 'someone'}, ${ago(o.at)}` : ''}</span>
        <button className="btn btn-ghost is-danger-text" onClick={remove}>
          Remove
        </button>
        <button className="btn btn-primary" disabled={!changed} onClick={() => onPatch(o, { email, page: page.trim() && !/^https?:/.test(page.trim()) ? `https://${page.trim()}` : page, note }, 'Saved.')}>
          Save
        </button>
      </div>
    </Modal>
  )
}

function TemplateSheet({ start, onClose, onSaved }: { start: Template; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp()
  const [subject, setSubject] = useState(start.subject)
  const [body, setBody] = useState(start.body)
  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await api('/api/admin/outreach/template', { subject, body })
      toast('Saved for everyone.')
      onSaved()
      onClose()
    } catch (err) {
      toast((err as Error).message)
    }
  }
  return (
    <Modal title="The email" onClose={onClose} wide>
      <form className="o-form is-stack" onSubmit={submit}>
        <p className="fine">[org] and [your name] fill in by themselves. Changes are for the whole team.</p>
        <label className="field">
          <span>Subject</span>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="field">
          <span>Message</span>
          <textarea className="input" rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}

function AddSheet({ data, onClose, onSaved }: { data: Data; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp()
  const [f, setF] = useState({ name: '', short: '', cluster: 'Other', email: '', page: '', owner: '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await api('/api/admin/outreach', f)
      toast('Added.')
      onSaved()
      onClose()
    } catch (err) {
      toast((err as Error).message)
    }
  }
  return (
    <Modal title="Add an org" onClose={onClose}>
      <form className="o-form" onSubmit={submit}>
        <label className="field o-wide">
          <span>Name</span>
          <input className="input" value={f.name} onChange={set('name')} autoFocus />
        </label>
        <label className="field">
          <span>Short name</span>
          <input className="input" value={f.short} placeholder="e.g. AMA" onChange={set('short')} />
        </label>
        <label className="field">
          <span>Cluster</span>
          <select className="input select" value={f.cluster} onChange={set('cluster')}>
            {data.clusters.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" value={f.email} onChange={set('email')} />
        </label>
        <label className="field">
          <span>Page</span>
          <input className="input" value={f.page} placeholder="https://facebook.com/…" onChange={set('page')} />
        </label>
        <label className="field o-wide">
          <span>Who emails them</span>
          <select className="input select" value={f.owner} onChange={set('owner')}>
            <option value="">Whoever has the fewest</option>
            {data.team.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="modal-actions o-wide">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={f.name.trim().length < 2}>
            Add
          </button>
        </div>
      </form>
    </Modal>
  )
}
