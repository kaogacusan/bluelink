import { useEffect, useState } from 'react'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Globe } from '@phosphor-icons/react/dist/csr/Globe'
import { FacebookLogo } from '@phosphor-icons/react/dist/csr/FacebookLogo'
import { InstagramLogo } from '@phosphor-icons/react/dist/csr/InstagramLogo'
import { Avatar } from '../components/Avatar'
import { OrgCover, OrgLogo } from '../components/OrgLogo'
import { Menu } from '../components/Menu'
import { Modal } from '../components/Modal'
import { Linkified } from '../components/Post'
import { Gallery } from '../components/Gallery'
import { PostList } from './Feed'
import { FollowButton, categoryLabel } from './Orgs'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { useLive } from '../lib/live'
import { href, go } from '../lib/router'
import { ago, personLine } from '../lib/format'
import type { OrgFull } from '../types'

function ApplyModal({ org, onClose, onDone }: { org: OrgFull; onClose: () => void; onDone: (o: OrgFull) => void }) {
  const { toast } = useApp()
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    try {
      const r = await api<{ org: OrgFull }>(`/api/orgs/${org.id}/apply`, { answer })
      onDone(r.org)
      toast(`Sent. ${org.short || org.name} will see your application.`)
      onClose()
    } catch (e) {
      toast((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={`Apply to ${org.short || org.name}`} onClose={onClose}>
      <p className="fine">The admins will see your profile and your answer.</p>
      <label className="field">
        <span>{org.question || 'Why do you want to join?'}</span>
        <textarea className="input" rows={5} maxLength={1500} autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={send} disabled={busy || !answer.trim()}>
          Send application
        </button>
      </div>
    </Modal>
  )
}

type Member = OrgFull['people'][number]

// Sets a member's job title, like "Founder and CEO".
function TitleModal({ org, person, onClose, onDone }: { org: OrgFull; person: Member; onClose: () => void; onDone: (o: OrgFull) => void }) {
  const { me, toast } = useApp()
  const [title, setTitle] = useState(person.title)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      const r = await api<{ org: OrgFull }>(`/api/orgs/${org.id}/members/${person.uid}/title`, { title })
      onDone(r.org)
      onClose()
    } catch (e) {
      toast((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={person.uid === me.uid ? 'Your title' : `${person.name.split(' ')[0]}'s title`} onClose={onClose}>
      <label className="field">
        <span>Title at {org.short || org.name}</span>
        <input className="input" maxLength={60} autoFocus placeholder="Founder and CEO" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          Save
        </button>
      </div>
    </Modal>
  )
}

export function OrgPage({ id, biz }: { id: string; biz?: boolean }) {
  const app = useApp()
  const { data, setData, error, reload } = useFetch<{ org: OrgFull }>(`/api/orgs/${id}`)
  // Old links send everyone to #/o/id. A business moves to #/businesses/id, so the menu shows Businesses.
  const type = data?.org.type
  useEffect(() => {
    if (type && (type === 'business') !== !!biz) location.replace(href.org(id, type))
  }, [type, biz, id])
  const [tab, setTab] = useState<'posts' | 'members' | 'apps'>('posts')
  const [applying, setApplying] = useState(false)
  const [titling, setTitling] = useState<Member | null>(null)
  useLive((e) => e.type === 'org' && e.id === id && reload())

  if (error && !data) return <p className="empty">{error}</p>
  if (!data) return <div className="card skeleton is-tall" />

  const org = data.org
  const admin = org.myRole === 'admin'
  const setOrg = (o: OrgFull) => setData({ org: o })

  async function act(path: string, done?: string) {
    try {
      const r = await api<{ org: OrgFull }>(`/api/orgs/${org.id}/${path}`, {})
      setOrg(r.org)
      if (done) app.toast(done)
      app.reloadMe()
    } catch (e) {
      app.toast((e as Error).message)
    }
  }

  async function leave() {
    try {
      await api(`/api/orgs/${org.id}/leave`, {})
      app.toast(`You left ${org.short || org.name}.`)
      app.reloadMe()
      reload()
    } catch (e) {
      app.toast((e as Error).message)
    }
  }

  const links = [
    { url: org.links.facebook, icon: FacebookLogo, label: 'Facebook' },
    { url: org.links.instagram, icon: InstagramLogo, label: 'Instagram' },
    { url: org.links.website, icon: Globe, label: 'Website' },
  ].filter((l) => l.url)

  return (
    <>
      <section className="card profile-card">
        <div className={org.cover ? 'profile-band is-org has-img' : 'profile-band is-org'}>
          <OrgCover org={org} />
        </div>
        <div className="profile-body">
          <div className="profile-avatar is-org">
            <OrgLogo org={org} size={104} />
          </div>
          <h1>{org.name}</h1>
          <p className="profile-meta">
            {categoryLabel(org.category)} · {org.members} {org.members === 1 ? 'member' : 'members'} · {org.followers} {org.followers === 1 ? 'follower' : 'followers'}
          </p>
          {org.recruiting && !org.myRole && <p className="recruiting is-block">{org.type === 'business' ? 'Hiring now' : 'Recruiting now'}</p>}

          <div className="profile-actions">
            {admin ? (
              <>
                <button className="btn btn-primary" onClick={() => app.compose('post', org.id)}>
                  <Plus weight="bold" /> Post as {org.short || 'org'}
                </button>
                <a className="btn btn-outline" href={href.editOrg(org.id, org.type)}>
                  <PencilSimple weight="bold" /> Edit
                </a>
              </>
            ) : org.myRole ? (
              <span className="btn btn-soft">
                <Check weight="bold" /> Member
              </span>
            ) : org.applied ? (
              <span className="btn btn-soft">
                <Check weight="bold" /> Applied
              </span>
            ) : org.recruiting ? (
              <button className="btn btn-primary" onClick={() => setApplying(true)}>
                Apply to join
              </button>
            ) : null}
            <FollowButton org={org} onChange={(o) => setOrg({ ...org, ...o })} size="md" />
            {(org.myRole || org.applied) && (
              <Menu
                items={[
                  ...(org.applied ? [{ label: 'Take back application', onClick: () => act('withdraw', 'Application taken back.') }] : []),
                  ...(org.myRole ? [{ label: `Leave ${org.short || 'org'}`, onClick: leave, danger: true }] : []),
                ]}
              />
            )}
          </div>

          {links.length > 0 && (
            <div className="org-links">
              {links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer nofollow">
                  <l.icon weight="bold" /> {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {org.about && (
        <section className="card section">
          <h2>About</h2>
          <p className="about">
            <Linkified text={org.about} />
          </p>
        </section>
      )}

      <Gallery
        items={org.gallery || []}
        look={org.portfolio}
        seed={org.id}
        empty={org.type === 'business' ? 'Show what you sell or make. Add pictures of products, projects, or your space.' : 'Show what your org does. Add pictures of events and projects.'}
        edit={
          admin
            ? {
                add: async (w) => setOrg((await api<{ org: OrgFull }>(`/api/orgs/${org.id}/gallery`, w)).org),
                update: async (id, w) => setOrg((await api<{ org: OrgFull }>(`/api/orgs/${org.id}/gallery/${id}/edit`, w)).org),
                remove: async (id) => setOrg((await api<{ org: OrgFull }>(`/api/orgs/${org.id}/gallery/${id}/remove`, {})).org),
                arrange: async (a) => setOrg((await api<{ org: OrgFull }>(`/api/orgs/${org.id}/portfolio`, a)).org),
              }
            : undefined
        }
      />

      <div className="seg page-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? 'is-on' : ''} onClick={() => setTab('posts')}>
          Posts
        </button>
        <button role="tab" aria-selected={tab === 'members'} className={tab === 'members' ? 'is-on' : ''} onClick={() => setTab('members')}>
          Members · {org.people.length}
        </button>
        {admin && (
          <button role="tab" aria-selected={tab === 'apps'} className={tab === 'apps' ? 'is-on' : ''} onClick={() => setTab('apps')}>
            Applications{org.applications.length ? ` · ${org.applications.length}` : ''}
          </button>
        )}
      </div>

      {tab === 'posts' && <PostList path={`/api/feed?org=${encodeURIComponent(org.id)}`} empty={admin ? 'No posts yet. Share your next event or call for members.' : 'No posts yet.'} />}

      {tab === 'members' && (
        <section className="card list-card">
          {org.people.map((p) => (
            <div key={p.uid} className="row">
              <a href={href.user(p.uid)} className="row-who">
                <Avatar person={p} size={44} />
                <div>
                  <b>{p.name}</b>
                  <span>{p.title || personLine(p)}</span>
                </div>
              </a>
              {p.orgRole === 'admin' && <span className="role-tag">Admin</span>}
              {(admin || p.uid === app.me.uid) && (
                <Menu
                  items={[
                    { label: p.title ? 'Change title' : 'Add title', onClick: () => setTitling(p) },
                    ...(admin && p.uid !== app.me.uid
                      ? [
                          p.orgRole === 'admin'
                            ? { label: 'Make a member', onClick: () => act(`members/${p.uid}/member`) }
                            : { label: 'Make an admin', onClick: () => act(`members/${p.uid}/admin`, `${p.name.split(' ')[0]} is now an admin.`) },
                          { label: 'Remove from org', onClick: () => act(`members/${p.uid}/remove`, 'Removed.'), danger: true },
                        ]
                      : []),
                  ]}
                />
              )}
            </div>
          ))}
        </section>
      )}

      {tab === 'apps' && admin && (
        <section className="card list-card">
          {!org.applications.length && <p className="empty">No applications right now.{!org.recruiting && ' Turn on Recruiting in Edit so people can apply.'}</p>}
          {org.applications.map((a) => (
            <div key={a.user.uid} className="req">
              <a href={href.user(a.user.uid)}>
                <Avatar person={a.user} size={44} />
              </a>
              <div className="req-body">
                <a href={href.user(a.user.uid)} className="req-name">
                  {a.user.name}
                </a>
                <span className="req-sub">
                  {personLine(a.user)} · {ago(a.at)}
                </span>
                {a.answer && <p className="req-note">{a.answer}</p>}
                <div className="req-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => act(`applications/${a.user.uid}/accept`, `${a.user.name.split(' ')[0]} is now a member.`)}>
                    Accept
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => act(`applications/${a.user.uid}/decline`, 'Application declined.')}>
                    Decline
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => go(href.user(a.user.uid))}>
                    View profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {applying && <ApplyModal org={org} onClose={() => setApplying(false)} onDone={setOrg} />}
      {titling && <TitleModal org={org} person={titling} onClose={() => setTitling(null)} onDone={(o) => { setOrg(o); app.reloadMe() }} />}
    </>
  )
}
