import { useState } from 'react'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { UserPlus } from '@phosphor-icons/react/dist/csr/UserPlus'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { api } from '../lib/api'
import { useApp } from '../lib/app'
import { href, go } from '../lib/router'
import { personLine } from '../lib/format'
import type { Person, Status } from '../types'

// Ready-made first lines, so no one has to stare at an empty box.
const STARTERS: Record<string, string> = {
  advice: 'Hi! Could I ask you a few questions about your path so far?',
  mentor: 'Hi! I would be happy to share what I know. What are you working on?',
  intern: 'Hi! Could I ask how you found your internship?',
  projects: 'Hi! I saw you like building things. Want to work on a project together?',
  events: 'Hi! Are you going to any events soon? I would love to join.',
  recruit: 'Hi! I am interested in joining. How do I apply?',
}

function startersFor(person: Person) {
  const list = person.openTo.map((id) => STARTERS[id]).filter(Boolean)
  return (list.length ? list : [STARTERS.advice, STARTERS.projects]).slice(0, 3)
}

export function ConnectModal({ person, onClose, onSent }: { person: Person; onClose: () => void; onSent: (s: Status) => void }) {
  const { toast } = useApp()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const first = person.name.split(' ')[0]

  async function send() {
    setBusy(true)
    setError('')
    try {
      const r = await api<{ status: Status }>(`/api/links/${person.uid}`, { note })
      onSent(r.status)
      toast(r.status === 'connected' ? `You and ${first} are now connected.` : `Sent. We will tell you when ${first} says yes.`)
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={`Say hi to ${first}`} onClose={onClose}>
      <div className="connect-who">
        <Avatar person={person} size={44} />
        <div>
          <b>{person.name}</b>
          <span>{personLine(person)}</span>
        </div>
      </div>
      <label className="field">
        <span>Add a note</span>
        <textarea
          className="input"
          rows={4}
          maxLength={400}
          value={note}
          autoFocus
          placeholder={`Tell ${first} why you want to connect.`}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="starters">
        {startersFor(person).map((s) => (
          <button key={s} type="button" className="starter" onClick={() => setNote(s)}>
            {s}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={send} disabled={busy}>
          {note.trim() ? 'Send' : 'Send without a note'}
        </button>
      </div>
    </Modal>
  )
}

interface ButtonProps {
  person: Person
  status: Status
  onChange: (s: Status) => void
  size?: 'sm' | 'md'
  block?: boolean
}

// One button that always shows the next step: Connect, Pending, Accept, or Message.
export function ConnectButton({ person, status, onChange, size = 'sm', block }: ButtonProps) {
  const { toast, refreshBadges } = useApp()
  const [open, setOpen] = useState(false)
  const cls = `btn ${size === 'sm' ? 'btn-sm' : ''} ${block ? 'btn-block' : ''}`

  async function accept() {
    try {
      await api(`/api/links/${person.uid}/accept`, {})
      onChange('connected')
      refreshBadges()
      toast(`You and ${person.name.split(' ')[0]} are now connected.`)
    } catch (e) {
      toast((e as Error).message)
    }
  }

  if (status === 'self') return null
  if (status === 'connected')
    return (
      <button className={`${cls} btn-outline`} onClick={() => go(href.inbox(person.uid))}>
        <ChatCircle weight="bold" /> Message
      </button>
    )
  if (status === 'sent')
    return (
      <button className={`${cls} btn-soft`} disabled>
        <Check weight="bold" /> Pending
      </button>
    )
  if (status === 'received')
    return (
      <button className={`${cls} btn-primary`} onClick={accept}>
        <Check weight="bold" /> Accept
      </button>
    )
  return (
    <>
      <button className={`${cls} btn-primary`} onClick={() => setOpen(true)}>
        <UserPlus weight="bold" /> Connect
      </button>
      {open && <ConnectModal person={person} onClose={() => setOpen(false)} onSent={onChange} />}
    </>
  )
}
