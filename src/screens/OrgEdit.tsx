import { useRef, useState } from 'react'
import { Camera } from '@phosphor-icons/react/dist/csr/Camera'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { OrgLogo } from '../components/OrgLogo'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { href, go } from '../lib/router'
import { toJpeg } from '../lib/format'
import { ORG_CATEGORIES } from '../../shared/options.js'
import type { OrgFull } from '../types'

type Draft = { name: string; short: string; category: string; about: string; recruiting: boolean; question: string; links: OrgFull['links'] }

const blank: Draft = { name: '', short: '', category: '', about: '', recruiting: true, question: '', links: { facebook: '', instagram: '', website: '' } }

function Form({ org }: { org?: OrgFull }) {
  const app = useApp()
  const [draft, setDraft] = useState<Draft>(org ? { ...org } : blank)
  const [logo, setLogo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p })
  const setLink = (k: keyof Draft['links'], v: string) => set({ links: { ...draft.links, [k]: v } })

  async function submit() {
    setBusy(true)
    setError('')
    try {
      let r = await api<{ org: OrgFull }>(org ? `/api/orgs/${org.id}` : '/api/orgs', draft)
      if (logo) r = await api<{ org: OrgFull }>(`/api/orgs/${r.org.id}/logo`, { data: logo })
      app.reloadMe()
      app.toast(org ? 'Saved.' : `${r.org.short || r.org.name} is on BlueLink.`)
      go(href.org(r.org.id))
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  async function remove() {
    try {
      await api(`/api/orgs/${org!.id}/delete`, {})
      app.reloadMe()
      app.toast('Org deleted.')
      go(href.orgs)
    } catch (e) {
      app.toast((e as Error).message)
    }
  }

  const preview = { id: org?.id ?? 'new', name: draft.name || 'New org', short: draft.short, logo: logo ?? org?.logo ?? null }

  return (
    <>
      <header className="page-head">
        <h1>{org ? 'Edit org' : 'Put your org on BlueLink'}</h1>
        {!org && <p>Your org gets a page, a members list, and a place to post events and calls for members.</p>}
      </header>
      <section className="card form-card">
        <div className="photo-pick">
          <button type="button" className="photo-btn" onClick={() => file.current?.click()} aria-label="Change logo">
            <OrgLogo org={preview} size={88} />
            <i>
              <Camera weight="fill" />
            </i>
          </button>
          <div>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => file.current?.click()}>
              {preview.logo ? 'Change logo' : 'Add a logo'}
            </button>
            <small>A square logo works best.</small>
          </div>
          <input
            ref={file}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) setLogo(await toJpeg(f).catch(() => null))
            }}
          />
        </div>

        <div className="field-row">
          <label className="field is-grow">
            <span>Org name</span>
            <input className="input" value={draft.name} maxLength={80} placeholder="e.g. Campus Coders Guild" onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="field">
            <span>Short name</span>
            <input className="input" value={draft.short} maxLength={16} placeholder="e.g. CCG" onChange={(e) => set({ short: e.target.value })} />
          </label>
        </div>

        <label className="field">
          <span>Type</span>
          <select className="input select" value={draft.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">Pick one</option>
            {ORG_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>About</span>
          <textarea className="input" rows={5} maxLength={1500} value={draft.about} placeholder="What does your org do? Who should join?" onChange={(e) => set({ about: e.target.value })} />
        </label>

        <label className="toggle">
          <input type="checkbox" checked={draft.recruiting} onChange={(e) => set({ recruiting: e.target.checked })} />
          <span className="toggle-track">
            <i>{draft.recruiting && <Check weight="bold" />}</i>
          </span>
          <span>
            <b>Recruiting now</b>
            <small>People can apply to join from your page.</small>
          </span>
        </label>

        {draft.recruiting && (
          <label className="field">
            <span>Question for applicants</span>
            <input className="input" value={draft.question} maxLength={200} placeholder="e.g. Why do you want to join?" onChange={(e) => set({ question: e.target.value })} />
          </label>
        )}

        <div className="field">
          <span>Links</span>
          <input className="input" value={draft.links.facebook} placeholder="Facebook page" onChange={(e) => setLink('facebook', e.target.value)} />
          <input className="input" value={draft.links.instagram} placeholder="Instagram" onChange={(e) => setLink('instagram', e.target.value)} />
          <input className="input" value={draft.links.website} placeholder="Website" onChange={(e) => setLink('website', e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <a className="btn btn-ghost" href={org ? href.org(org.id) : href.orgs}>
            Cancel
          </a>
          <button className="btn btn-primary" onClick={submit} disabled={busy || draft.name.trim().length < 2}>
            {org ? 'Save' : 'Create org'}
          </button>
        </div>
      </section>

      {org && (
        <section className="card section">
          <div className="setting">
            <span>{confirm ? 'This deletes the org page and all its posts. You cannot undo it.' : 'Delete this org'}</span>
            {confirm ? (
              <button className="btn btn-sm btn-danger" onClick={remove}>
                Yes, delete
              </button>
            ) : (
              <button className="btn btn-sm btn-ghost is-danger-text" onClick={() => setConfirm(true)}>
                Delete
              </button>
            )}
          </div>
        </section>
      )}
    </>
  )
}

export function NewOrg() {
  return <Form />
}

export function EditOrg({ id }: { id: string }) {
  const { data, error } = useFetch<{ org: OrgFull }>(`/api/orgs/${id}`)
  if (error && !data) return <p className="empty">{error}</p>
  if (!data) return <div className="card skeleton is-tall" />
  if (data.org.myRole !== 'admin') return <p className="empty">Only org admins can edit this page.</p>
  return <Form org={data.org} />
}
