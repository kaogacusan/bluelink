import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { PostCard } from '../components/Post'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { useLive } from '../lib/live'
import { href, type FeedKind } from '../lib/router'
import type { Post } from '../types'

const FILTERS: { kind?: FeedKind; label: string }[] = [
  { label: 'All' },
  { kind: 'work', label: 'Open for work' },
  { kind: 'opp', label: 'Opportunities' },
  { kind: 'event', label: 'Events' },
]

const EMPTY: Record<string, string> = {
  all: 'Nothing here yet. Be the first to post.',
  work: 'No one has posted yet. Good at something? Say you are open for work.',
  opp: 'No opportunities yet. Know of an internship or an org opening? Share it.',
  event: 'No events yet. Hosting something? Post it.',
}

type FeedData = { posts: Post[]; more: boolean }

// Shows a list of posts. Used by the home feed and by profiles.
export function PostList({ path, empty }: { path: string; empty: string }) {
  const { data, setData, error, reload } = useFetch<FeedData>(path)
  const [loadingMore, setLoadingMore] = useState(false)
  useLive((e) => e.type === 'feed' && reload())

  const update = (p: Post) => data && setData({ ...data, posts: data.posts.map((x) => (x.id === p.id ? p : x)) })
  const remove = (id: string) => data && setData({ ...data, posts: data.posts.filter((x) => x.id !== id) })

  async function more() {
    if (!data?.posts.length) return
    setLoadingMore(true)
    try {
      const sep = path.includes('?') ? '&' : '?'
      const r = await api<FeedData>(`${path}${sep}before=${data.posts[data.posts.length - 1].at}`)
      setData({ posts: [...data.posts, ...r.posts], more: r.more })
    } finally {
      setLoadingMore(false)
    }
  }

  if (error && !data) return <p className="empty">{error}</p>
  if (!data) return <div className="card skeleton" />
  if (!data.posts.length) return <p className="empty">{empty}</p>
  return (
    <div className="post-list">
      {data.posts.map((p) => (
        <PostCard key={p.id} post={p} onChange={update} onRemove={remove} />
      ))}
      {data.more && (
        <button className="btn btn-ghost btn-block" onClick={more} disabled={loadingMore}>
          Show more
        </button>
      )}
    </div>
  )
}

export function Feed({ kind }: { kind?: FeedKind }) {
  const { me, compose } = useApp()
  const missing = [!me.photo && 'a photo', !me.openTo.length && 'what you are open to', !me.headline && 'a headline'].filter(Boolean) as string[]
  const needsProfile = missing.length > 0

  return (
    <>
      <section className="card compose-card">
        <div className="compose-row">
          <Avatar person={me} size={44} />
          <button className="compose-prompt" onClick={() => compose()}>
            Share an update, an opportunity, or an event
          </button>
        </div>
      </section>

      {needsProfile && (
        <section className="card nudge">
          <div>
            <b>Finish your profile</b>
            <p>Add {missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}` : missing[0]}. People say yes more often when they know who you are.</p>
          </div>
          <a className="btn btn-sm btn-outline" href={href.edit}>
            Edit profile
          </a>
        </section>
      )}

      <nav className="filters" aria-label="Filter posts">
        {FILTERS.map((f) => (
          <a key={f.label} href={href.feedKind(f.kind)} className={`chip ${kind === f.kind ? 'is-on' : ''}`} aria-current={kind === f.kind ? 'page' : undefined}>
            {f.label}
          </a>
        ))}
      </nav>

      <PostList key={kind ?? 'all'} path={`/api/feed${kind ? `?kind=${kind}` : ''}`} empty={EMPTY[kind ?? 'all']} />
    </>
  )
}
