import { useState } from 'react'
import { UserPlus } from '@phosphor-icons/react/dist/csr/UserPlus'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { Avatar } from './Avatar'
import { OrgLogo } from './OrgLogo'
import { ConnectModal } from './Connect'
import { MyNetwork } from './Network'
import { useFetch } from '../lib/api'
import { useLive } from '../lib/live'
import { href } from '../lib/router'
import { eventDay, eventWhen, personLine } from '../lib/format'
import type { Org, Person, Post } from '../types'

function Suggestion({ person }: { person: Person }) {
  const [status, setStatus] = useState(person.status ?? 'none')
  const [open, setOpen] = useState(false)
  return (
    <li className="mini">
      <a href={href.user(person.uid)} className="mini-who">
        <Avatar person={person} size={40} />
        <div>
          <b>{person.name}</b>
          <span>{person.headline || personLine(person)}</span>
        </div>
      </a>
      {status === 'none' ? (
        <button className="icon-btn is-outline" aria-label={`Connect with ${person.name}`} onClick={() => setOpen(true)}>
          <UserPlus weight="bold" />
        </button>
      ) : (
        <span className="icon-btn is-done" aria-label="Request sent">
          <Check weight="bold" />
        </span>
      )}
      {open && <ConnectModal person={person} onClose={() => setOpen(false)} onSent={setStatus} />}
    </li>
  )
}

export function Rail() {
  const people = useFetch<{ people: Person[] }>('/api/suggest')
  const events = useFetch<{ events: Post[] }>('/api/events')
  const orgs = useFetch<{ orgs: Org[] }>('/api/orgs?show=recruiting')
  const recruiting = orgs.data?.orgs.filter((o) => !o.myRole && !o.applied).slice(0, 3) ?? []
  useLive((e) => e.type === 'feed' && events.reload())

  return (
    <>
      <MyNetwork />

      {!!people.data?.people.length && (
        <section className="card rail-card">
          <h2>People to meet</h2>
          <ul className="mini-list">
            {people.data.people.map((p) => (
              <Suggestion key={p.uid} person={p} />
            ))}
          </ul>
          <a className="rail-more" href={href.people}>
            See everyone
          </a>
        </section>
      )}

      {!!events.data?.events.length && (
        <section className="card rail-card">
          <h2>Coming up</h2>
          <ul className="mini-list">
            {events.data.events.map((p) => {
              const d = eventDay(p.event!.date)
              return (
                <li key={p.id} className="mini">
                  <a href={href.feedKind('event')} className="mini-who">
                    <span className="event-date is-sm" aria-hidden>
                      <span>{d.month}</span>
                      <b>{d.day}</b>
                    </span>
                    <div>
                      <b>{p.event!.title}</b>
                      <span>
                        {eventWhen(p.event!.date, p.event!.time)}
                        {p.going ? ` · ${p.going} going` : ''}
                      </span>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {recruiting.length > 0 && (
        <section className="card rail-card">
          <h2>Orgs recruiting now</h2>
          <ul className="mini-list">
            {recruiting.map((o) => (
              <li key={o.id} className="mini">
                <a href={href.org(o.id)} className="mini-who">
                  <OrgLogo org={o} size={40} />
                  <div>
                    <b>{o.name}</b>
                    <span>{o.members} members</span>
                  </div>
                </a>
                <a className="btn btn-sm btn-outline" href={href.org(o.id)}>
                  Apply
                </a>
              </li>
            ))}
          </ul>
          <a className="rail-more" href={href.orgs}>
            See all orgs
          </a>
        </section>
      )}

      <p className="rail-foot">
        Made by Ateneans. Not an official Ateneo de Manila University service. <a href={href.privacy}>Privacy</a> · <a href={href.terms}>Terms</a>
      </p>
    </>
  )
}
