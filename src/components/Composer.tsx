import { useState } from 'react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { OrgLogo } from './OrgLogo'
import { api } from '../lib/api'
import { useApp, type ComposeKind } from '../lib/app'
import { emitLive } from '../lib/live'
import { KINDS } from '../../shared/options.js'

const PLACEHOLDER: Record<ComposeKind, string> = {
  post: 'What do you want to share?',
  work: 'What can you do, and what kind of work do you want? Like “I edit videos for orgs. Looking for paid projects this break.”',
  opp: 'Share an internship, job, org opening, or scholarship. Say how to apply.',
  event: 'What is it about? Who should come?',
}

export function Composer({ kind: startKind, orgId: startOrg, onClose }: { kind: ComposeKind; orgId?: string; onClose: () => void }) {
  const { me, orgs, toast } = useApp()
  const adminOf = orgs.filter((o) => o.myRole === 'admin')
  const [orgId, setOrgId] = useState(startOrg ?? '')
  const org = adminOf.find((o) => o.id === orgId)
  const [kind, setKind] = useState<ComposeKind>(startKind)
  const [text, setText] = useState('')
  const [event, setEvent] = useState({ title: '', date: '', time: '', place: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const setE = (patch: Partial<typeof event>) => setEvent({ ...event, ...patch })
  const ready = kind === 'event' ? event.title.trim() && event.date : text.trim()

  async function submit() {
    setBusy(true)
    setError('')
    try {
      await api('/api/posts', { kind, text, event: kind === 'event' ? event : undefined, orgId: org?.id })
      emitLive({ type: 'feed' })
      toast('Posted.')
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title="Create a post" onClose={onClose}>
      <div className="kind-picker" role="group" aria-label="Post type">
        {KINDS.map((k) => (
          <button key={k.id} aria-pressed={kind === k.id} className={`chip ${kind === k.id ? 'is-on' : ''}`} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>

      <div className="composer-who">
        {org ? <OrgLogo org={org} size={40} /> : <Avatar person={me} size={40} />}
        <div>
          {adminOf.length ? (
            <select className="as-select" value={orgId} onChange={(e) => setOrgId(e.target.value)} aria-label="Post as">
              <option value="">{me.name}</option>
              {adminOf.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          ) : (
            <b>{me.name}</b>
          )}
          <span>Everyone at Ateneo can see this</span>
        </div>
      </div>

      {kind === 'event' && (
        <div className="event-fields">
          <label className="field">
            <span>Event name</span>
            <input className="input" maxLength={100} value={event.title} placeholder="e.g. Org fair open house" onChange={(e) => setE({ title: e.target.value })} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Date</span>
              <input className="input" type="date" value={event.date} onChange={(e) => setE({ date: e.target.value })} />
            </label>
            <label className="field">
              <span>Time</span>
              <input className="input" type="time" value={event.time} onChange={(e) => setE({ time: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>Place</span>
            <input className="input" maxLength={80} value={event.place} placeholder="e.g. Faber Hall, or Zoom" onChange={(e) => setE({ place: e.target.value })} />
          </label>
        </div>
      )}

      <textarea
        className="input composer-text"
        rows={kind === 'event' ? 3 : 6}
        maxLength={2000}
        autoFocus={kind !== 'event'}
        value={text}
        placeholder={PLACEHOLDER[kind]}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <span className="count">{text.length > 1700 ? `${2000 - text.length} left` : ''}</span>
        <button className="btn btn-primary" onClick={submit} disabled={!ready || busy}>
          Post
        </button>
      </div>
    </Modal>
  )
}
