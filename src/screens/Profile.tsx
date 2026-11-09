import { useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { SpaceCover, catalogNo } from '../components/Network'
import { Avatar } from '../components/Avatar'
import { OrgLogo } from '../components/OrgLogo'
import { categoryLabel } from './Orgs'
import { ConnectButton } from '../components/Connect'
import { Menu } from '../components/Menu'
import { OpenTo } from '../components/OpenTo'
import { ReportModal } from '../components/Report'
import { Gallery } from '../components/Gallery'
import { Linkified } from '../components/Post'
import { PostList } from './Feed'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { href, go } from '../lib/router'
import { personLine, roleLabel, schoolName } from '../lib/format'
import type { FullPerson, MyOrg, Status } from '../types'

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
          <a className="btn btn-sm btn-outline" href={href.admin}>
            Admin
          </a>
        </div>
      )}
      <div className="setting">
        <span>Theme</span>
        <div className="seg is-sm">
          {(['light', 'dark'] as const).map((t) => (
            <button key={t} className={theme === t ? 'is-on' : ''} onClick={() => setTheme(t)}>
              {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <span>Sign out of blueLink on this device</span>
        <button className="btn btn-sm btn-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
      <div className="setting">
        <span>Get a copy of everything we keep about you</span>
        <button className="btn btn-sm btn-ghost" onClick={download}>
          Download my data
        </button>
      </div>
      <div className="setting">
        <span>
          Read the <a href={href.privacy}>Privacy Notice</a> and the <a href={href.terms}>Terms</a>
        </span>
      </div>
      <div className="setting">
        <span>{confirm ? 'This deletes your profile, posts, and messages. You cannot undo it.' : 'Delete your account'}</span>
        {confirm ? (
          <button className="btn btn-sm btn-danger" onClick={deleteAccount}>
            Yes, delete
          </button>
        ) : (
          <button className="btn btn-sm btn-ghost is-danger-text" onClick={() => setConfirm(true)}>
            Delete
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

  const meta = [personLine(user), user.school && user.role !== 'faculty' ? schoolName(user.school) : '', `${data.connections} ${data.connections === 1 ? 'connection' : 'connections'}`, data.mutual ? `${data.mutual} mutual` : '']

  return (
    <>
      <section className="card profile-card">
        <div className="profile-band">
          <SpaceCover seed={user.uid} />
          <span className="cover-label">{catalogNo(user.uid)}{user.role ? ` · ${roleLabel(user.role)}` : ''}</span>
        </div>
        <div className="profile-body">
          <div className="profile-avatar">
            <Avatar person={user} size={112} />
          </div>
          <h1>{user.name}</h1>
          {user.headline && <p className="profile-headline">{user.headline}</p>}
          <p className="profile-meta">{meta.filter(Boolean).join(' · ')}</p>

          {status === 'received' && (
            <div className="request-box">
              <p>
                <b>{first} wants to connect.</b>
                {data.note && <> “{data.note}”</>}
              </p>
            </div>
          )}

          <div className="profile-actions">
            {isMe ? (
              <a className="btn btn-outline" href={href.edit}>
                <PencilSimple weight="bold" /> Edit profile
              </a>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      <section className="card section">
        <h2>Open to</h2>
        {user.openTo.length ? (
          <>
            <p className="fine">{isMe ? 'People see this and know it is OK to reach out.' : `${first} is happy to hear from you about these.`}</p>
            <OpenTo ids={user.openTo} highlight={isMe ? [] : app.me.openTo} />
          </>
        ) : (
          <p className="fine">{isMe ? 'Pick what you are open to so people know they can reach out.' : 'Nothing picked yet.'}</p>
        )}
      </section>

      {user.about && (
        <section className="card section">
          <h2>About</h2>
          <p className="about">
            <Linkified text={user.about} />
          </p>
        </section>
      )}

      <Gallery items={user.gallery || []} isMe={isMe} />

      {user.skills.length > 0 && (
        <section className="card section">
          <h2>Can help with</h2>
          <ul className="tags">
            {user.skills.map((s) => (
              <li key={s} className="tag is-plain">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(data.orgs.length > 0 || isMe) && (
        <section className="card section">
          <h2>Orgs</h2>
          {data.orgs.length ? (
            <div className="org-mini-list">
              {data.orgs.map((o) => (
                <a key={o.id} href={href.org(o.id)} className="row-who">
                  <OrgLogo org={o} size={40} />
                  <div>
                    <b>{o.name}</b>
                    <span>
                      {o.myRole === 'admin' ? 'Admin' : 'Member'} · {categoryLabel(o.category)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="fine">
              You are not in any org yet. <a href={href.orgs}>Find one</a> or <a href={href.newOrg}>add yours</a>.
            </p>
          )}
        </section>
      )}

      {isMe && <Settings />}

      <h2 className="section-title">{isMe ? 'Your posts' : `Posts by ${first}`}</h2>
      <PostList path={`/api/feed?author=${encodeURIComponent(user.uid)}`} empty={isMe ? 'You have not posted yet.' : `${first} has not posted yet.`} />

      {reporting && <ReportModal uid={user.uid} onClose={() => setReporting(false)} />}
    </>
  )
}
