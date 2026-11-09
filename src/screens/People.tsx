import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Avatar } from '../components/Avatar'
import { ConnectButton } from '../components/Connect'
import { OpenTo } from '../components/OpenTo'
import { useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { href } from '../lib/router'
import { personLine } from '../lib/format'
import { OPEN_TO, ROLES, SCHOOLS } from '../../shared/options.js'
import type { Person, Status } from '../types'

function PersonCard({ person, mine }: { person: Person; mine: string[] }) {
  const [status, setStatus] = useState<Status>(person.status ?? 'none')
  return (
    <article className="card person">
      <a href={href.user(person.uid)} className="person-top">
        <Avatar person={person} size={72} />
        <b>{person.name}</b>
        <span>{personLine(person)}</span>
      </a>
      {person.headline && <p className="person-headline">{person.headline}</p>}
      <div className="person-tags">
        <OpenTo ids={person.openTo} max={3} highlight={mine} />
      </div>
      <ConnectButton person={person} status={status} onChange={setStatus} block />
    </article>
  )
}

export function People() {
  const { me } = useApp()
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('')
  const [school, setSchool] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 220)
    return () => clearTimeout(t)
  }, [q])

  const params = new URLSearchParams(Object.entries({ q: query, open, school, role }).filter(([, v]) => v))
  const { data, error } = useFetch<{ people: Person[] }>(`/api/people?${params}`)

  return (
    <>
      <header className="page-head">
        <h1>People</h1>
        <p>Every tag means they are happy to hear from you about it.</p>
      </header>

      <div className="search">
        <MagnifyingGlass weight="bold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, courses, or skills" aria-label="Search people" />
      </div>

      <div className="filters" role="group" aria-label="Open to">
        <button className={`chip ${!open ? 'is-on' : ''}`} onClick={() => setOpen('')}>
          Anyone
        </button>
        {OPEN_TO.map((o) => (
          <button key={o.id} className={`chip ${open === o.id ? 'is-on' : ''}`} onClick={() => setOpen(open === o.id ? '' : o.id)}>
            {o.label}
          </button>
        ))}
      </div>

      <div className="selects">
        <select className="input select" value={school} onChange={(e) => setSchool(e.target.value)} aria-label="School">
          <option value="">All schools</option>
          {SCHOOLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.short}
            </option>
          ))}
        </select>
        <select className="input select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">Students, alumni, and faculty</option>
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
            <PersonCard key={p.uid} person={p} mine={me.openTo} />
          ))}
        </div>
      )}
    </>
  )
}
