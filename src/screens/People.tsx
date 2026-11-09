import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Avatar } from '../components/Avatar'
import { BannerBand } from '../components/Banner'
import { ConnectButton } from '../components/Connect'
import { OpenToChips } from '../components/OpenTo'
import { OrgCover, OrgLogo } from '../components/OrgLogo'
import { useFetch } from '../lib/api'
import { href } from '../lib/router'
import { personLine } from '../lib/format'
import { affiliationRole, sortAffiliations } from './Profile'
import { OPEN_TO, ROLES } from '../../shared/options.js'
import type { Person, Status } from '../types'

// The profile header, small: banner, photo, name, then their main org or business as a strip, the rest as logos.
function PersonCard({ person }: { person: Person }) {
  const [status, setStatus] = useState<Status>(person.status ?? 'none')
  const [main, ...rest] = sortAffiliations(person.orgs || [], person.highlight || '')
  return (
    <article className="card person">
      <a href={status === 'self' ? href.me : href.user(person.uid)} className="person-top">
        <BannerBand person={person} className="profile-band person-band" />
        <span className="person-avatar">
          <Avatar person={person} size={88} />
        </span>
        {/* Same order as the profile page: name, headline, then course and year. */}
        <b>{person.name}</b>
        {person.headline && <span className="person-headline">{person.headline}</span>}
        <span className="person-line">{personLine(person)}</span>
      </a>
      <div className="person-body">
        {main && (
          <div className="person-aff">
            <a href={href.org(main.id, main.type)} className="aff is-mini">
              <OrgCover org={main} />
              <OrgLogo org={main} size={28} />
              <span className="aff-text">
                <b>{main.name}</b>
                <small>{affiliationRole(main)}</small>
              </span>
            </a>
            {rest.slice(0, 2).map((o) => (
              <a key={o.id} href={href.org(o.id, o.type)} className="person-aff-logo" title={o.name} aria-label={o.name}>
                <OrgLogo org={o} size={28} />
              </a>
            ))}
            {rest.length > 2 && <span className="person-aff-more">+{rest.length - 2}</span>}
          </div>
        )}
        {person.openTo.length > 0 && <OpenToChips ids={person.openTo} max={3} />}
        {status === 'self' ? (
          <a className="btn btn-sm btn-block btn-outline" href={href.edit}>
            <PencilSimple weight="bold" /> Edit profile
          </a>
        ) : (
          <ConnectButton person={person} status={status} onChange={setStatus} block />
        )}
      </div>
    </article>
  )
}

export function People() {
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 220)
    return () => clearTimeout(t)
  }, [q])

  const params = new URLSearchParams(Object.entries({ q: query, open, role }).filter(([, v]) => v))
  const { data, error } = useFetch<{ people: Person[] }>(`/api/people?${params}`)

  return (
    <>
      <header className="page-head">
        <h1>People</h1>
      </header>

      <div className="search">
        <MagnifyingGlass weight="bold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, courses, or skills" aria-label="Search people" />
      </div>

      <div className="selects">
        <select className="input select" value={open} onChange={(e) => setOpen(e.target.value)} aria-label="Open to">
          <option value="">Anyone</option>
          {OPEN_TO.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="input select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">All people</option>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id === 'alum' ? 'Alumni' : r.id === 'student' ? 'Students' : 'Faculty and staff'}
            </option>
          ))}
        </select>
      </div>

      {error && !data && <p className="empty">{error}</p>}
      {data && !data.people.length && <p className="empty">No one matches yet. Try fewer filters.</p>}
      {data && (
        <div className="people-grid">
          {data.people.map((p) => (
            <PersonCard key={p.uid} person={p} />
          ))}
        </div>
      )}
    </>
  )
}
