import type { ReactNode } from 'react'
import { House } from '@phosphor-icons/react/dist/csr/House'
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree'
import { ChatsCircle } from '@phosphor-icons/react/dist/csr/ChatsCircle'
import { UserCircle } from '@phosphor-icons/react/dist/csr/UserCircle'
import { Flag } from '@phosphor-icons/react/dist/csr/Flag'
import { ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { Rail } from './Rail'
import { Sky } from './Network'
import { useApp } from '../lib/app'
import { href, type Route } from '../lib/router'

const NAV = [
  { key: 'feed', label: 'Home', to: href.feed, icon: House },
  { key: 'people', label: 'People', to: href.people, icon: UsersThree },
  { key: 'orgs', label: 'Orgs', to: href.orgs, icon: Flag },
  { key: 'inbox', label: 'Messages', to: href.inbox(), icon: ChatsCircle },
  { key: 'me', label: 'Profile', to: href.me, icon: UserCircle },
] as const

const activeKey = (r: Route) => (r.page === 'edit' ? 'me' : r.page === 'user' ? 'people' : ['org', 'newOrg', 'editOrg'].includes(r.page) ? 'orgs' : r.page)

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { me, badges, compose, isAdmin } = useApp()
  const active = activeKey(route)
  const rail = ['feed', 'people', 'user', 'orgs', 'org'].includes(route.page)
  const inThread = route.page === 'inbox' && !!route.id

  return (
    <div className={`layout ${rail ? 'has-rail' : ''} ${route.page === 'inbox' ? 'is-inbox' : ''} ${inThread ? 'in-thread' : ''}`}>
      <aside className="side">
        <Sky seed="bluelink-side" />
        <a href={href.feed} className="side-logo" aria-label="BlueLink home">
          <Logo size={30} />
        </a>
        <nav className="side-nav">
          {NAV.map((n) => (
            <a key={n.key} href={n.to} className={`side-link ${active === n.key ? 'is-on' : ''}`} aria-current={active === n.key ? 'page' : undefined}>
              <n.icon weight={active === n.key ? 'fill' : 'regular'} />
              <span>{n.label}</span>
              {n.key === 'inbox' && badges > 0 && <i className="badge">{badges}</i>}
            </a>
          ))}
          {isAdmin && (
            <a href={href.admin} className={`side-link ${route.page === 'admin' ? 'is-on' : ''}`}>
              <ShieldCheck weight={route.page === 'admin' ? 'fill' : 'regular'} />
              <span>Admin</span>
            </a>
          )}
        </nav>
        <button className="btn btn-primary btn-block side-post" onClick={() => compose()}>
          <Plus weight="bold" /> Post
        </button>
        <a href={href.me} className="side-me">
          <Avatar person={me} size={36} />
          <div>
            <b>{me.name}</b>
            <span>View profile</span>
          </div>
        </a>
      </aside>

      <header className="mtop">
        <a href={href.feed} aria-label="BlueLink home">
          <Logo size={26} />
        </a>
        <div className="mtop-right">
          <a href={href.people} className="icon-btn" aria-label="Find people">
            <MagnifyingGlass weight="bold" />
          </a>
          <a href={href.me} aria-label="Your profile">
            <Avatar person={me} size={32} />
          </a>
        </div>
      </header>

      <main className="main">{children}</main>

      {rail && (
        <aside className="rail">
          <Rail />
        </aside>
      )}

      <nav className="tabs">
        {NAV.slice(0, 2).map((n) => (
          <a key={n.key} href={n.to} className={`tab ${active === n.key ? 'is-on' : ''}`}>
            <n.icon weight={active === n.key ? 'fill' : 'regular'} />
            <span>{n.label}</span>
          </a>
        ))}
        <button className="tab tab-post" onClick={() => compose()} aria-label="Create a post">
          <i>
            <Plus weight="bold" />
          </i>
          <span>Post</span>
        </button>
        {NAV.slice(2, 4).map((n) => (
          <a key={n.key} href={n.to} className={`tab ${active === n.key ? 'is-on' : ''}`}>
            <n.icon weight={active === n.key ? 'fill' : 'regular'} />
            <span>{n.label}</span>
            {n.key === 'inbox' && badges > 0 && <i className="badge">{badges}</i>}
          </a>
        ))}
      </nav>
    </div>
  )
}
