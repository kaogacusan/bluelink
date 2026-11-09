import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { OrgLogo } from '../components/OrgLogo'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { go, href } from '../lib/router'
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
      <a href={href.org(org.id, org.type)} className="org-card-top">
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
        {org.recruiting && !org.myRole ? <span className="recruiting">{org.type === 'business' ? 'Hiring now' : 'Recruiting now'}</span> : org.myRole ? <span className="org-role">{org.myRole === 'admin' ? 'You are an admin' : 'You are a member'}</span> : <span />}
        <FollowButton org={org} onChange={setOrg} />
      </div>
    </article>
  )
}

const KINDS = [
  { id: 'org', label: 'Orgs', to: href.orgs, create: href.newOrg, search: 'Search orgs', none: 'No orgs here yet.', add: 'Put your org on BlueLink' },
  { id: 'business', label: 'Businesses', to: href.businesses, create: href.newBusiness, search: 'Search businesses', none: 'No businesses here yet.', add: 'Put your business on BlueLink' },
] as const

export function Orgs({ type = 'org' }: { type?: 'org' | 'business' }) {
  const t = KINDS.find((k) => k.id === type)!
  const isOrg = type === 'org'
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 220)
    return () => clearTimeout(t)
  }, [q])

  const params = new URLSearchParams(Object.entries({ type: isOrg ? '' : type, q: query, cat: isOrg ? cat : '' }).filter(([, v]) => v))
  const { data, error } = useFetch<{ orgs: Org[] }>(`/api/orgs?${params}`)

  return (
    <>
      <header className="page-head is-row">
        <h1>Orgs & businesses</h1>
        <a className="btn btn-primary" href={t.create}>
          Create
        </a>
      </header>

      <div className="seg page-tabs" role="tablist">
        {KINDS.map((k) => (
          <button key={k.id} role="tab" aria-selected={type === k.id} className={type === k.id ? 'is-on' : ''} onClick={() => go(k.to)}>
            {k.label}
          </button>
        ))}
      </div>

      <div className="search">
        <MagnifyingGlass weight="bold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
      </div>

      {isOrg && (
        <div className="filters">
          <select className="input select chip-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="">Any type</option>
            {ORG_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && !data && <p className="empty">{error}</p>}
      {data && !data.orgs.length && (
        <div className="empty">
          <p>{t.none}</p>
          <a className="btn btn-outline" href={t.create}>
            {t.add}
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
