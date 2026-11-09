import { useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Avatar } from '../components/Avatar'
import { BannerBand } from '../components/Banner'
import { OrgCover, OrgLogo } from '../components/OrgLogo'
import { ConnectButton } from '../components/Connect'
import { Menu } from '../components/Menu'
import { OpenToChips } from '../components/OpenTo'
import { ReportModal } from '../components/Report'
import { Gallery } from '../components/Gallery'
import { Linkified } from '../components/Post'
import { PostList } from './Feed'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { href, go } from '../lib/router'
import { personLine } from '../lib/format'
import type { FullPerson, MyOrg, Status } from '../types'

// The highlight comes first. Then businesses before orgs, and admin roles before member roles.
export function sortAffiliations(orgs: MyOrg[], highlight: string) {
  const rank = (o: MyOrg) => (o.id === highlight ? 0 : 4) + (o.type === 'business' ? 0 : 2) + (o.myRole === 'admin' ? 0 : 1)
  return [...orgs].sort((a, b) => rank(a) - rank(b))
}

export const affiliationRole = (o: MyOrg) => o.title || `${o.type === 'business' ? 'Business' : 'Org'} · ${o.myRole === 'admin' ? 'Admin' : 'Member'}`

type ProfileData = { user: FullPerson; status: Status; note: string; connections: number; mutual: number; orgs: MyOrg[] }

function Settings() {
  const { theme, setTheme, signOut, toast, membership, isAdmin } = useApp()
  const [confirm, setConfirm] = useState(false)

  // Your right to a copy of your data. Saves one JSON file with everything we keep about you.
  async function download() {
    try {
      const data = await api('/api/me/export')
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const a = Object.assign(document.createElement('a'), { href: url, download: 'my-bluelink-data.json' })
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast((e as Error).message)
    }
  }

  async function deleteAccount() {
    try {
      await api('/api/me/delete', {})
      signOut()
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <section className="card section">
      <h2>Settings</h2>
      <div className="setting">
        <span>
          Membership
          {membership.via === 'admin'
            ? ': admin'
            : membership.lifetime
              ? ': lifetime'
              : membership.until
              ? ` until ${new Date(membership.until).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : ''}
          {membership.status === 'pending' ? ' (payment being checked)' : ''}
        </span>
      </div>
      {isAdmin && (
        <div className="setting">
          <span>Check payments and reports</span>
          <a className="btn btn-sm btn-outline setting-btn" href={href.admin}>
            Admin
          </a>
        </div>
      )}
      <div className="setting">
        <span>Theme</span>
        <button className="btn btn-sm btn-outline setting-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="setting">
        <span>Export my data</span>
        <button className="btn btn-sm btn-outline setting-btn" onClick={download}>
          Download
        </button>
      </div>
      <div className="setting">
        <span>
          Read the <a href={href.privacy}>Privacy Notice</a> and the <a href={href.terms}>Terms</a>
        </span>
      </div>
      <div className="settings-foot">
        <button className="btn btn-outline btn-block" onClick={signOut}>
          Sign out
        </button>
        {confirm ? (
          <div className="settings-delete is-confirm">
            <span>This deletes your profile, posts, and messages. You cannot undo it.</span>
            <div className="settings-delete-actions">
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-sm btn-danger" onClick={deleteAccount}>
                Yes, delete
              </button>
            </div>
          </div>
        ) : (
          <button className="settings-delete is-danger-text" onClick={() => setConfirm(true)}>
            Delete your account
          </button>
        )}
      </div>
    </section>
  )
}

export function Profile({ id }: { id?: string }) {
  const app = useApp()
  const isMe = !id || id === app.me.uid
  const fetched = useFetch<ProfileData>(isMe ? null : `/api/people/${id}`)
  const [reporting, setReporting] = useState(false)

  const data: ProfileData | null = isMe ? { user: app.me, status: 'self', note: '', connections: app.connections, mutual: 0, orgs: app.orgs } : fetched.data
  if (!isMe && fetched.error && !data) return <p className="empty">{fetched.error}</p>
  if (!data) return <div className="card skeleton is-tall" />

  const { user, status } = data
  const first = user.name.split(' ')[0]
  const setStatus = (s: Status) => fetched.data && fetched.setData({ ...fetched.data, status: s, note: s === 'connected' ? '' : fetched.data.note })

  async function remove(toast: string) {
    await api(`/api/links/${user.uid}/remove`, {})
    setStatus('none')
    app.refreshBadges()
    app.toast(toast)
  }

  async function block() {
    await api('/api/block', { uid: user.uid })
    app.toast(`You will not see ${first} again.`)
    go(href.feed)
  }

  const affiliations = sortAffiliations(data.orgs, user.highlight)

  const meta = [personLine(user), `${data.connections} ${data.connections === 1 ? 'connection' : 'connections'}`, data.mutual ? `${data.mutual} mutual` : '']

  return (
    <div className="profile">
      <section className="card profile-card">
        <BannerBand person={user} className="profile-band" />
        <div className="profile-body">
          {isMe && (
            <a className="icon-btn is-outline profile-edit" href={href.edit} aria-label="Edit profile" title="Edit profile">
              <PencilSimple weight="bold" />
            </a>
          )}
          <div className="profile-avatar">
            <Avatar person={user} size={112} />
          </div>
          <h1>{user.name}</h1>
          {user.headline && <p className="profile-headline">{user.headline}</p>}
          <p className="profile-meta">{meta.filter(Boolean).join(' · ')}</p>

          {affiliations.length > 0 ? (
            <div className={`profile-aff is-${Math.min(affiliations.length, 3)}`}>
              {affiliations.map((o, i) => (
                <a key={o.id} href={href.org(o.id, o.type)} className={`aff ${i === 0 ? 'is-main' : 'is-sub'}`}>
                  {i === 0 && <OrgCover org={o} />}
                  <OrgLogo org={o} size={i === 0 ? 56 : 32} />
                  <span className="aff-text">
                    <b>{o.name}</b>
                    <small>{affiliationRole(o)}</small>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            isMe && (
              <p className="profile-aff-empty">
                Not in an org or business yet. <a href={href.orgs}>Find one</a> or <a href={href.newOrg}>add yours</a>.
              </p>
            )
          )}

          {status === 'received' && (
            <div className="request-box">
              <p>
                <b>{first} wants to connect.</b>
                {data.note && <> “{data.note}”</>}
              </p>
            </div>
          )}

          {!isMe && (
            <div className="profile-actions">
              <ConnectButton person={user} status={status} onChange={setStatus} size="md" />
              {status === 'received' && (
                <button className="btn btn-ghost" onClick={() => remove('Request ignored.')}>
                  Ignore
                </button>
              )}
              <Menu
                items={[
                  ...(status === 'sent' ? [{ label: 'Take back request', onClick: () => remove('Request taken back.') }] : []),
                  ...(status === 'connected' ? [{ label: 'Remove connection', onClick: () => remove('Connection removed.') }] : []),
                  { label: `Report ${first}`, onClick: () => setReporting(true) },
                  { label: `Block ${first}`, onClick: block, danger: true },
                ]}
              />
            </div>
          )}
        </div>
      </section>

      {user.about && (
        <section className="card section">
          <h2>About</h2>
          <p className="about">
            <Linkified text={user.about} />
          </p>
        </section>
      )}

      {(isMe || user.openTo.length > 0 || user.skills.length > 0) && (
        <section className="card section facts">
          {(isMe || user.openTo.length > 0) && (
            <div className="fact">
              <h2>Open to</h2>
              {user.openTo.length ? <OpenToChips ids={user.openTo} /> : <a href={href.edit}>Add what you are open to</a>}
            </div>
          )}
          {(isMe || user.skills.length > 0) && (
            <div className="fact">
              <h2>Skills</h2>
              {user.skills.length ? (
                <ul className="skills">
                  {user.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <a href={href.edit}>Add your skills</a>
              )}
            </div>
          )}
        </section>
      )}

      <Gallery
        items={user.gallery || []}
        look={user.portfolio}
        seed={user.uid}
        empty="Show what you have made. Add pictures of projects, designs, or events."
        edit={
          isMe
            ? {
                add: async (w) => app.setMe((await api<{ user: FullPerson }>('/api/me/gallery', w)).user),
                update: async (id, w) => app.setMe((await api<{ user: FullPerson }>(`/api/me/gallery/${id}/edit`, w)).user),
                remove: async (id) => app.setMe((await api<{ user: FullPerson }>(`/api/me/gallery/${id}/remove`, {})).user),
                arrange: async (a) => app.setMe((await api<{ user: FullPerson }>('/api/me/portfolio', a)).user),
              }
            : undefined
        }
      />

      {isMe && <Settings />}

      <h2 className="section-title">{isMe ? 'Your posts' : `Posts by ${first}`}</h2>
      <PostList path={`/api/feed?author=${encodeURIComponent(user.uid)}`} empty={isMe ? 'You have not posted yet.' : `${first} has not posted yet.`} />

      {reporting && <ReportModal uid={user.uid} onClose={() => setReporting(false)} />}
    </div>
  )
}
