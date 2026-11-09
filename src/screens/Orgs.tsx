import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { OrgLogo } from '../components/OrgLogo'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { href } from '../lib/router'
import { ORG_CATEGORIES } from '../../shared/options.js'
import type { Org } from '../types'

export const categoryLabel = (id: string) => ORG_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other'

export function FollowButton({ org, onChange, size = 'sm' }: { org: Org; onChange: (o: Org) => void; size?: 'sm' | 'md' }) {
  const { toast } = useApp()
  async function toggle() {
    onChange({ ...org, following: !org.following, followers: org.followers + (org.following ? -1 : 1) })
    try {
      await api(`/api/orgs/${org.id}/follow`, {})
    } catch (e) {
      onChange(org)
      toast((e as Error).message)
    }
  }
  if (org.myRole) return null
  return (
    <button className={`btn ${size === 'sm' ? 'btn-sm' : ''} ${org.following ? 'btn-soft is-active' : 'btn-outline'}`} onClick={toggle}>
      {org.following ? 'Following' : 'Follow'}
    </button>
  )
}

function OrgCard({ org: start }: { org: Org }) {
  const [org, setOrg] = useState(start)
  return (
    <article className="card org-card">
      <a href={href.org(org.id)} className="org-card-top">
        <OrgLogo org={org} size={56} />
        <div>
          <b>{org.name}</b>
          <span>
            {categoryLabel(org.category)} · {org.members} {org.members === 1 ? 'member' : 'members'}
          </span>
        </div>
      </a>
      {org.about && <p className="org-card-about">{org.about}</p>}
      <div className="org-card-foot">
        {org.recruiting && !org.myRole ? <span className="recruiting">Recruiting now</span> : org.myRole ? <span className="org-role">{org.myRole === 'admin' ? 'You are an admin' : 'You are a member'}</span> : <span />}
        <FollowButton org={org} onChange={setOrg} />
      </div>
    </article>
  )
}

const SHOW = [
  { id: '', label: 'All orgs' },
  { id: 'recruiting', label: 'Recruiting now' },
  { id: 'mine', label: 'Mine' },
]

export function Orgs() {
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [show, setShow] = useState('')
  const [cat, setCat] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 220)
    return () => clearTimeout(t)
  }, [q])

  const params = new URLSearchParams(Object.entries({ q: query, show, cat }).filter(([, v]) => v))
  const { data, error } = useFetch<{ orgs: Org[] }>(`/api/orgs?${params}`)

  return (
    <>
      <header className="page-head is-row">
        <div>
          <h1>Orgs</h1>
          <p>Follow orgs, see what they are up to, and apply in one tap.</p>
        </div>
        <a className="btn btn-primary" href={href.newOrg}>
          <Plus weight="bold" /> New org
        </a>
      </header>

      <div className="search">
        <MagnifyingGlass weight="bold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orgs" aria-label="Search orgs" />
      </div>

      <div className="filters">
        {SHOW.map((s) => (
          <button key={s.id} className={`chip ${show === s.id ? 'is-on' : ''}`} onClick={() => setShow(s.id)}>
            {s.label}
          </button>
        ))}
        <select className="input select chip-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">Any type</option>
          {ORG_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {error && !data && <p className="empty">{error}</p>}
      {data && !data.orgs.length && (
        <div className="empty">
          <p>No orgs here yet.</p>
          <a className="btn btn-outline" href={href.newOrg}>
            Put your org on blueLink
          </a>
        </div>
      )}
      {data && (
        <div className="org-grid">
          {data.orgs.map((o) => (
            <OrgCard key={o.id} org={o} />
          ))}
        </div>
      )}
    </>
  )
}
