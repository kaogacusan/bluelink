import { useRef, useState, type KeyboardEvent } from 'react'
import { Camera } from '@phosphor-icons/react/dist/csr/Camera'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple'
import { Avatar } from '../components/Avatar'
import { BannerBand, isBannerPicture } from '../components/Banner'
import { BannerArt } from '../components/Network'
import { OrgLogo } from '../components/OrgLogo'
import { OpenToPicker } from '../components/OpenTo'
import { BasicsFields, HeadlineField, type ProfileDraft } from '../components/ProfileFields'
import { api } from '../lib/api'
import { useApp } from '../lib/app'
import { href, go } from '../lib/router'
import { fitJpeg, toJpeg } from '../lib/format'
import { affiliationRole, sortAffiliations } from './Profile'
import { BANNERS } from '../../shared/options.js'
import type { FullPerson, MyOrg } from '../types'

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

// Plain gray, one of the drawn banners, or a picture of your own. Saves on click, like the photo.
function BannerPicker() {
  const { me, setMe, toast } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const picture = isBannerPicture(me.banner)

  async function save(body: { template: string } | { data: string }) {
    setBusy(true)
    try {
      const r = await api<{ user: FullPerson }>('/api/me/banner', body)
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
      await save({ data: await fitJpeg(file, 1600, 900_000) })
    } catch {
      toast('That banner did not work. Try another one.')
    }
  }

  const opt = (on: boolean) => `banner-opt ${on ? 'is-on' : ''}`
  return (
    <div className="banner-pick">
      <BannerBand person={me} className="profile-band banner-preview" />
      <div className="banner-opts" role="radiogroup" aria-label="Banner">
        <button type="button" role="radio" aria-checked={!me.banner} className={opt(!me.banner)} onClick={() => save({ template: '' })} disabled={busy}>
          <span className="banner-thumb is-empty" />
          None
        </button>
        {BANNERS.map((b) => (
          <button key={b.id} type="button" role="radio" aria-checked={me.banner === b.id} className={opt(me.banner === b.id)} onClick={() => save({ template: b.id })} disabled={busy}>
            <span className="banner-thumb">
              <BannerArt id={b.id} seed={me.uid} />
            </span>
            {b.label}
          </button>
        ))}
        <button type="button" role="radio" aria-checked={picture} className={opt(picture)} onClick={() => input.current?.click()} disabled={busy}>
          <span className="banner-thumb is-upload">{picture ? <img className="cover-img" src={me.banner!} alt="" /> : <UploadSimple weight="bold" />}</span>
          {picture ? 'Change' : 'Upload'}
        </button>
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
      <span>Skills</span>
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
    </div>
  )
}

// Which org or business shows first and biggest on your profile.
function HighlightField({ orgs, value, onChange }: { orgs: MyOrg[]; value: string; onChange: (id: string) => void }) {
  // The list keeps one order. Only the pick moves.
  const on = sortAffiliations(orgs, value)[0].id
  return (
    <div className="field">
      <span>Highlight</span>
      <div className="hl-pick" role="radiogroup" aria-label="Highlight">
        {sortAffiliations(orgs, '').map((o) => (
          <label key={o.id} className={`hl-opt ${o.id === on ? 'is-on' : ''}`}>
            <input type="radio" name="highlight" checked={o.id === on} onChange={() => onChange(o.id)} />
            <OrgLogo org={o} size={32} />
            <span>
              <b>{o.name}</b>
              <small>{affiliationRole(o)}</small>
            </span>
          </label>
        ))}
      </div>
      <small>Shown first and biggest on your profile. The rest show next to it.</small>
    </div>
  )
}

export function EditProfile() {
  const { me, setMe, toast, orgs } = useApp()
  const [draft, setDraft] = useState<ProfileDraft & { highlight: string }>({ ...me })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (p: Partial<typeof draft>) => setDraft({ ...draft, ...p })

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
        <BannerPicker />
        <PhotoPicker />
        <BasicsFields value={draft} set={set} />
        <HeadlineField value={draft} set={set} />
        {orgs.length > 1 && <HighlightField orgs={orgs} value={draft.highlight} onChange={(highlight) => set({ highlight })} />}
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
