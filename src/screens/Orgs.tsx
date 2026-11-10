import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
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
  { id: 'all', label: 'Any type' },
  { id: 'org', label: 'Orgs' },
  { id: 'business', label: 'Businesses' },
] as const

type Kind = (typeof KINDS)[number]['id']

export function Orgs({ type = 'all' }: { type?: Kind }) {
  const [kind, setKind] = useState<Kind>(type)
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const create = kind === 'business' ? href.newBusiness : href.newOrg

  useEffect(() => setKind(type), [type])

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 220)
    return () => clearTimeout(t)
  }, [q])

  const params = new URLSearchParams(Object.entries({ type: kind, q: query }).filter(([, v]) => v))
  const { data, error } = useFetch<{ orgs: Org[] }>(`/api/orgs?${params}`)

  return (
    <>
      <header className="page-head is-row">
        <h1>Orgs & businesses</h1>
        <a className="btn btn-primary" href={create}>
          Create
        </a>
      </header>

      <div className="search">
        <MagnifyingGlass weight="bold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orgs and businesses" aria-label="Search orgs and businesses" />
      </div>

      <div className="filters">
        <select className="input select chip-select" value={kind} onChange={(e) => setKind(e.target.value as Kind)} aria-label="Show">
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      {error && !data && <p className="empty">{error}</p>}
      {data && !data.orgs.length && (
        <div className="empty">
          <p>Nothing here yet.</p>
          <a className="btn btn-outline" href={create}>
            {kind === 'business' ? 'Put your business on BlueLink' : 'Put your org on BlueLink'}
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
