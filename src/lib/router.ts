import { useEffect, useState } from 'react'

export type FeedKind = 'work' | 'opp' | 'event'

const FEED_PATHS: Record<string, FeedKind> = { work: 'work', opportunities: 'opp', events: 'event' }

export type Route =
  | { page: 'feed'; kind?: FeedKind }
  | { page: 'people' }
  | { page: 'orgs' }
  | { page: 'businesses' }
  | { page: 'newOrg'; biz?: boolean }
  | { page: 'org'; id: string; biz?: boolean }
  | { page: 'editOrg'; id: string; biz?: boolean }
  | { page: 'user'; id: string }
  | { page: 'inbox'; id?: string }
  | { page: 'me' }
  | { page: 'edit' }
  | { page: 'admin'; tab?: 'outreach' }
  | { page: 'legal'; doc: 'privacy' | 'terms' }

export function parse(hash: string): Route {
  const [a, b] = hash.replace(/^#\/?/, '').split('/')
  if (Object.hasOwn(FEED_PATHS, a)) return { page: 'feed', kind: FEED_PATHS[a] }
  if (a === 'people') return { page: 'people' }
  if (a === 'admin') return b === 'outreach' ? { page: 'admin', tab: 'outreach' } : { page: 'admin' }
  if (a === 'privacy' || a === 'terms') return { page: 'legal', doc: a }
  if (a === 'orgs') return b === 'new' ? { page: 'newOrg' } : { page: 'orgs' }
  if (a === 'businesses' && !b) return { page: 'businesses' }
  if (a === 'businesses' && b === 'new') return { page: 'newOrg', biz: true }
  // Orgs live at #/o/id, businesses at #/businesses/id.
  if ((a === 'o' || a === 'businesses') && b) {
    const id = decodeURIComponent(b)
    const biz = a === 'businesses'
    return hash.endsWith('/edit') ? { page: 'editOrg', id, biz } : { page: 'org', id, biz }
  }
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
  outreach: '#/admin/outreach',
  orgs: '#/orgs',
  businesses: '#/businesses',
  newOrg: '#/orgs/new',
  newBusiness: '#/businesses/new',
  org: (id: string, type?: 'org' | 'business') => `#/${type === 'business' ? 'businesses' : 'o'}/${encodeURIComponent(id)}`,
  editOrg: (id: string, type?: 'org' | 'business') => `${href.org(id, type)}/edit`,
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
