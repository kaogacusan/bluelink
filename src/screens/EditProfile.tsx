import { useRef, useState, type KeyboardEvent } from 'react'
import { Camera } from '@phosphor-icons/react/dist/csr/Camera'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Avatar } from '../components/Avatar'
import { OpenToPicker } from '../components/OpenTo'
import { BasicsFields, HeadlineField, type ProfileDraft } from '../components/ProfileFields'
import { api } from '../lib/api'
import { useApp } from '../lib/app'
import { href, go } from '../lib/router'
import { toJpeg } from '../lib/format'
import type { FullPerson } from '../types'

export function PhotoPicker({ size = 96 }: { size?: number }) {
  const { me, setMe, toast } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function upload(data: string | null) {
    setBusy(true)
    try {
      const r = await api<{ user: FullPerson }>('/api/me/photo', { data })
      setMe(r.user)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file?: File) {
    if (!file) return
    try {
      await upload(await toJpeg(file))
    } catch {
      toast('That photo did not work. Try another one.')
    }
  }

  return (
    <div className="photo-pick">
      <button type="button" className="photo-btn" onClick={() => input.current?.click()} disabled={busy} aria-label="Change photo">
        <Avatar person={me} size={size} />
        <i>
          <Camera weight="fill" />
        </i>
      </button>
      <div>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => input.current?.click()} disabled={busy}>
          {me.photo ? 'Change photo' : 'Add a photo'}
        </button>
        {me.photo && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => upload(null)} disabled={busy}>
            Remove
          </button>
        )}
        <small>A clear photo of your face helps people trust you.</small>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  )
}

function SkillsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const s = draft.trim().replace(/,$/, '')
    if (s && !value.some((x) => x.toLowerCase() === s.toLowerCase()) && value.length < 12) onChange([...value, s])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <div className="field">
      <span>Can help with</span>
      <div className="skills-input">
        {value.map((s) => (
          <span key={s} className="tag is-plain">
            {s}
            <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((x) => x !== s))}>
              <X weight="bold" />
            </button>
          </span>
        ))}
        <input value={draft} maxLength={32} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={add} placeholder={value.length ? '' : 'e.g. Python, Debate, Resumes'} />
      </div>
      <small>Press Enter after each one.</small>
    </div>
  )
}

export function EditProfile() {
  const { me, setMe, toast } = useApp()
  const [draft, setDraft] = useState<ProfileDraft>({ ...me })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (p: Partial<ProfileDraft>) => setDraft({ ...draft, ...p })

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const r = await api<{ user: FullPerson }>('/api/me', draft)
      setMe(r.user)
      toast('Profile saved.')
      go(href.me)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <>
      <header className="page-head">
        <h1>Edit profile</h1>
      </header>
      <section className="card form-card">
        <PhotoPicker />
        <BasicsFields value={draft} set={set} />
        <HeadlineField value={draft} set={set} />
        <div className="field">
          <span>Open to</span>
          <OpenToPicker value={draft.openTo} onChange={(openTo) => set({ openTo })} />
        </div>
        <label className="field">
          <span>About</span>
          <textarea className="input" rows={5} maxLength={1200} value={draft.about} placeholder="What are you into? What are you working on?" onChange={(e) => set({ about: e.target.value })} />
        </label>
        <SkillsField value={draft.skills} onChange={(skills) => set({ skills })} />
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <a className="btn btn-ghost" href={href.me}>
            Cancel
          </a>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            Save
          </button>
        </div>
      </section>
    </>
  )
}
