import { useEffect, useState } from 'react'

export type FeedKind = 'ask' | 'work' | 'opp' | 'event'

const FEED_PATHS: Record<string, FeedKind> = { asks: 'ask', work: 'work', opportunities: 'opp', events: 'event' }

export type Route =
  | { page: 'feed'; kind?: FeedKind }
  | { page: 'people' }
  | { page: 'orgs' }
  | { page: 'newOrg' }
  | { page: 'org'; id: string }
  | { page: 'editOrg'; id: string }
  | { page: 'user'; id: string }
  | { page: 'inbox'; id?: string }
  | { page: 'me' }
  | { page: 'edit' }
  | { page: 'admin' }
  | { page: 'legal'; doc: 'privacy' | 'terms' }

export function parse(hash: string): Route {
  const [a, b] = hash.replace(/^#\/?/, '').split('/')
  if (Object.hasOwn(FEED_PATHS, a)) return { page: 'feed', kind: FEED_PATHS[a] }
  if (a === 'people') return { page: 'people' }
  if (a === 'admin') return { page: 'admin' }
  if (a === 'privacy' || a === 'terms') return { page: 'legal', doc: a }
  if (a === 'orgs') return b === 'new' ? { page: 'newOrg' } : { page: 'orgs' }
  if (a === 'o' && b) return hash.endsWith('/edit') ? { page: 'editOrg', id: decodeURIComponent(b) } : { page: 'org', id: decodeURIComponent(b) }
  if (a === 'u' && b) return { page: 'user', id: decodeURIComponent(b) }
  if (a === 'inbox') return { page: 'inbox', id: b ? decodeURIComponent(b) : undefined }
  if (a === 'me') return b === 'edit' ? { page: 'edit' } : { page: 'me' }
  return { page: 'feed' }
}

export const href = {
  feed: '#/',
  feedKind: (kind?: FeedKind) => (kind ? `#/${Object.keys(FEED_PATHS).find((k) => FEED_PATHS[k] === kind)}` : '#/'),
  people: '#/people',
  admin: '#/admin',
  orgs: '#/orgs',
  newOrg: '#/orgs/new',
  org: (id: string) => `#/o/${encodeURIComponent(id)}`,
  editOrg: (id: string) => `#/o/${encodeURIComponent(id)}/edit`,
  user: (uid: string) => `#/u/${encodeURIComponent(uid)}`,
  inbox: (uid?: string) => (uid ? `#/inbox/${encodeURIComponent(uid)}` : '#/inbox'),
  me: '#/me',
  edit: '#/me/edit',
  privacy: '#/privacy',
  terms: '#/terms',
}

export const go = (to: string) => void (location.hash = to)

export function useRoute() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parse(hash)
}
