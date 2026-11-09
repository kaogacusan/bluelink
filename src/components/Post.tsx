import { useState, type FormEvent } from 'react'
import { ThumbsUp } from '@phosphor-icons/react/dist/csr/ThumbsUp'
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle'
import { CalendarCheck } from '@phosphor-icons/react/dist/csr/CalendarCheck'
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Briefcase } from '@phosphor-icons/react/dist/csr/Briefcase'
import { Handshake } from '@phosphor-icons/react/dist/csr/Handshake'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { PaperPlaneRight } from '@phosphor-icons/react/dist/csr/PaperPlaneRight'
import { Avatar } from './Avatar'
import { OrgLogo } from './OrgLogo'
import { Menu } from './Menu'
import { ReportModal } from './Report'
import { api } from '../lib/api'
import { useApp } from '../lib/app'
import { href } from '../lib/router'
import { ago, eventDay, eventWhen, personLine } from '../lib/format'
import type { Post } from '../types'

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g

export function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_RE).map((part, i) =>
        i % 2 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  )
}

const KIND_LABEL = {
  work: { icon: Handshake, text: 'Open for work' },
  opp: { icon: Briefcase, text: 'Opportunity' },
  event: { icon: CalendarBlank, text: 'Event' },
} as const

function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 320 || text.split('\n').length > 6
  return (
    <p className={`post-text ${long && !open ? 'is-clamped' : ''}`}>
      <Linkified text={text} />
      {long && !open && (
        <button className="more-link" onClick={() => setOpen(true)}>
          See more
        </button>
      )}
    </p>
  )
}

interface Props {
  post: Post
  onChange: (p: Post) => void
  onRemove: (id: string) => void
}

export function PostCard({ post, onChange, onRemove }: Props) {
  const { toast } = useApp()
  const [showAll, setShowAll] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState(false)
  const kind = post.kind !== 'post' ? KIND_LABEL[post.kind] : null

  async function act(path: string, body: unknown = {}) {
    try {
      const r = await api<{ post: Post }>(`/api/posts/${post.id}/${path}`, body)
      onChange(r.post)
      return true
    } catch (e) {
      toast((e as Error).message)
      return false
    }
  }

  // Likes and going feel instant: we show the change first, then save it.
  function toggle(field: 'like' | 'going') {
    if (field === 'like') onChange({ ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) })
    else onChange({ ...post, isGoing: !post.isGoing, going: post.going + (post.isGoing ? -1 : 1) })
    act(field)
  }

  async function comment(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim() || busy) return
    setBusy(true)
    if (await act('comments', { text: draft })) {
      setDraft('')
      setShowAll(true)
    }
    setBusy(false)
  }

  async function remove() {
    try {
      await api(`/api/posts/${post.id}/delete`, {})
      onRemove(post.id)
      toast('Post deleted.')
    } catch (e) {
      toast((e as Error).message)
    }
  }

  async function block() {
    try {
      await api('/api/block', { uid: post.author.uid })
      onRemove(post.id)
      toast(`You will not see ${post.author.name} again.`)
    } catch (e) {
      toast((e as Error).message)
    }
  }

  const comments = showAll ? post.comments : post.comments.slice(-1)
  const day = post.event ? eventDay(post.event.date) : null

  return (
    <article className="card post">
      <header className="post-head">
        {post.org ? (
          <>
            <a href={href.org(post.org.id, post.org.type)} className="post-avatar">
              <OrgLogo org={post.org} size={44} />
            </a>
            <div className="post-who">
              <a href={href.org(post.org.id, post.org.type)} className="post-name">
                {post.org.name}
              </a>
              <span className="post-sub">
                Org · by <a href={href.user(post.author.uid)}>{post.author.name}</a> · {ago(post.at)}
              </span>
            </div>
          </>
        ) : (
          <>
            <a href={href.user(post.author.uid)} className="post-avatar">
              <Avatar person={post.author} size={44} />
            </a>
            <div className="post-who">
              <a href={href.user(post.author.uid)} className="post-name">
                {post.author.name}
              </a>
              <span className="post-sub">
                {personLine(post.author)} · {ago(post.at)}
              </span>
            </div>
          </>
        )}
        <Menu
          items={
            post.canDelete
              ? [{ label: 'Delete post', onClick: remove, danger: true }]
              : [
                  { label: 'Report post', onClick: () => setReporting(true) },
                  { label: `Block ${post.author.name.split(' ')[0]}`, onClick: block, danger: true },
                ]
          }
        />
      </header>

      {kind && (
        <p className={`post-kind kind-${post.kind}`}>
          <kind.icon weight="bold" /> {kind.text}
        </p>
      )}

      {post.event && day && (
        <div className="event-box">
          <div className="event-date" aria-hidden>
            <span>{day.month}</span>
            <b>{day.day}</b>
          </div>
          <div className="event-info">
            <h3>{post.event.title}</h3>
            <p>
              <Clock weight="bold" /> {eventWhen(post.event.date, post.event.time)}
            </p>
            {post.event.place && (
              <p>
                <MapPin weight="bold" /> {post.event.place}
              </p>
            )}
          </div>
        </div>
      )}

      {post.text && <LongText text={post.text} />}

      <footer className="post-actions">
        <button className={`act ${post.liked ? 'is-on' : ''}`} onClick={() => toggle('like')} aria-pressed={post.liked}>
          <ThumbsUp weight={post.liked ? 'fill' : 'bold'} />
          <span>Like{post.likes ? ` · ${post.likes}` : ''}</span>
        </button>
        <button className="act" onClick={() => (setCommenting(true), setShowAll(true))}>
          <ChatCircle weight="bold" />
          <span>Comment{post.comments.length ? ` · ${post.comments.length}` : ''}</span>
        </button>
        {post.kind === 'event' && (
          <button className={`act ${post.isGoing ? 'is-on' : ''}`} onClick={() => toggle('going')} aria-pressed={post.isGoing}>
            <CalendarCheck weight={post.isGoing ? 'fill' : 'bold'} />
            <span>Going{post.going ? ` · ${post.going}` : ''}</span>
          </button>
        )}
      </footer>

      {(comments.length > 0 || commenting) && (
        <div className="comments">
          {!showAll && post.comments.length > 1 && (
            <button className="more-link" onClick={() => setShowAll(true)}>
              View all {post.comments.length} comments
            </button>
          )}
          {comments.map((c) => (
            <div className="comment" key={c.id}>
              <a href={href.user(c.author.uid)}>
                <Avatar person={c.author} size={32} />
              </a>
              <div className="comment-body">
                <div className="comment-top">
                  <a href={href.user(c.author.uid)}>{c.author.name}</a>
                  <span>{ago(c.at)}</span>
                  {(c.mine || post.canDelete) && (
                    <button className="comment-del" onClick={() => act(`comments/${c.id}/delete`)}>
                      Delete
                    </button>
                  )}
                </div>
                <p>
                  <Linkified text={c.text} />
                </p>
              </div>
            </div>
          ))}
          {commenting && (
            <form className="comment-form" onSubmit={comment}>
              <input
                className="input"
                value={draft}
                maxLength={600}
                autoFocus
                placeholder="Add a comment"
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="icon-btn is-blue" aria-label="Send comment" disabled={!draft.trim() || busy}>
                <PaperPlaneRight weight="fill" />
              </button>
            </form>
          )}
        </div>
      )}

      {reporting && <ReportModal uid={post.author.uid} postId={post.id} onClose={() => setReporting(false)} />}
    </article>
  )
}
