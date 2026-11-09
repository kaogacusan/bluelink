import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { PaperPlaneRight } from '@phosphor-icons/react/dist/csr/PaperPlaneRight'
import { ChatsCircle } from '@phosphor-icons/react/dist/csr/ChatsCircle'
import { Avatar } from '../components/Avatar'
import { ConnectButton } from '../components/Connect'
import { Linkified } from '../components/Post'
import { api, useFetch } from '../lib/api'
import { useApp } from '../lib/app'
import { useLive } from '../lib/live'
import { href } from '../lib/router'
import { ago, clock, personLine } from '../lib/format'
import type { Message, Person, Request, Status, Thread } from '../types'

type InboxData = { requests: Request[]; sent: Request[]; threads: Thread[] }
type ThreadData = { user: Person; status: Status; messages: Message[] }

function RequestRow({ req, onDone }: { req: Request; onDone: () => void }) {
  const { toast, refreshBadges } = useApp()
  const first = req.user.name.split(' ')[0]

  async function answer(accept: boolean) {
    try {
      await api(`/api/links/${req.user.uid}/${accept ? 'accept' : 'remove'}`, {})
      toast(accept ? `You and ${first} are now connected.` : 'Request ignored.')
      refreshBadges()
      onDone()
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <li className="req">
      <a href={href.user(req.user.uid)}>
        <Avatar person={req.user} size={44} />
      </a>
      <div className="req-body">
        <a href={href.user(req.user.uid)} className="req-name">
          {req.user.name}
        </a>
        <span className="req-sub">
          {personLine(req.user)} · {ago(req.at)}
        </span>
        {req.note && <p className="req-note">{req.note}</p>}
        <div className="req-actions">
          <button className="btn btn-sm btn-primary" onClick={() => answer(true)}>
            Accept
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => answer(false)}>
            Ignore
          </button>
        </div>
      </div>
    </li>
  )
}

const dayLabel = (ts: number) => {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(Date.now() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}

function ThreadView({ uid, onSent }: { uid: string; onSent: () => void }) {
  const { refreshBadges, toast } = useApp()
  const { data, setData, error, reload } = useFetch<ThreadData>(`/api/threads/${uid}`)
  const [text, setText] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  useLive((e) => e.type === 'message' && e.from === uid && reload().then(refreshBadges))
  useEffect(() => {
    if (data) refreshBadges()
  }, [data?.messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [data?.messages.length])

  // The box grows with the text, up to a few lines.
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [text])

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || !data) return
    const temp: Message = { id: 'tmp' + Date.now(), text: body, at: Date.now(), mine: true, pending: true }
    setData({ ...data, messages: [...data.messages, temp] })
    setText('')
    try {
      const r = await api<{ message: Message }>(`/api/threads/${uid}`, { text: body })
      setData((d) => d && { ...d, messages: d.messages.map((m) => (m.id === temp.id ? r.message : m)) })
      onSent()
    } catch (err) {
      setData((d) => d && { ...d, messages: d.messages.filter((m) => m.id !== temp.id) })
      setText(body)
      toast((err as Error).message)
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  if (error && !data) return <p className="empty">{error}</p>
  if (!data) return <div className="thread" />

  const { user, status, messages } = data
  let lastDay = ''

  return (
    <div className="thread">
      <header className="thread-head">
        <a href={href.inbox()} className="icon-btn thread-back" aria-label="Back to messages">
          <ArrowLeft weight="bold" />
        </a>
        <a href={href.user(user.uid)} className="thread-who">
          <Avatar person={user} size={40} />
          <div>
            <b>{user.name}</b>
            <span>{user.headline || personLine(user)}</span>
          </div>
        </a>
      </header>

      <div className="thread-list" ref={list}>
        {status !== 'connected' ? (
          <div className="thread-empty">
            <Avatar person={user} size={72} />
            <p>{status === 'sent' ? `Waiting for ${user.name.split(' ')[0]} to accept your request.` : `Connect with ${user.name.split(' ')[0]} to start talking.`}</p>
            <ConnectButton person={user} status={status} onChange={(s) => (s === 'connected' ? reload() : setData({ ...data, status: s }))} size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="thread-empty">
            <Avatar person={user} size={72} />
            <p>You are connected. Say hi.</p>
          </div>
        ) : (
          messages.map((m) => {
            const day = dayLabel(m.at)
            const showDay = day !== lastDay
            lastDay = day
            return (
              <div key={m.id} className="msg-wrap">
                {showDay && <p className="day">{day}</p>}
                <div className={`msg ${m.mine ? 'is-mine' : ''} ${m.pending ? 'is-pending' : ''}`} title={clock(m.at)}>
                  <Linkified text={m.text} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {status === 'connected' && (
        <form className="thread-input" onSubmit={send}>
          <textarea ref={box} rows={1} value={text} maxLength={2000} placeholder="Write a message" onChange={(e) => setText(e.target.value)} onKeyDown={onKey} aria-label="Message" />
          <button className="icon-btn is-blue" aria-label="Send" disabled={!text.trim()}>
            <PaperPlaneRight weight="fill" />
          </button>
        </form>
      )}
    </div>
  )
}

export function Inbox({ id }: { id?: string }) {
  const { data, reload } = useFetch<InboxData>('/api/inbox')
  useLive((e) => (e.type === 'inbox' || e.type === 'message') && reload())

  return (
    <div className={`inbox ${id ? 'has-thread' : ''}`}>
      <section className="card inbox-list">
        <h1>Messages</h1>
        {!data ? null : (
          <>
            {data.requests.length > 0 && (
              <>
                <h2>Requests · {data.requests.length}</h2>
                <ul className="reqs">
                  {data.requests.map((r) => (
                    <RequestRow key={r.user.uid} req={r} onDone={reload} />
                  ))}
                </ul>
              </>
            )}
            {data.threads.length > 0 && (
              <>
                {data.requests.length > 0 && <h2>Conversations</h2>}
                <ul className="threads">
                  {data.threads.map((t) => (
                    <li key={t.user.uid}>
                      <a href={href.inbox(t.user.uid)} className={`trow ${id === t.user.uid ? 'is-on' : ''} ${t.unread ? 'is-unread' : ''}`}>
                        <Avatar person={t.user} size={48} />
                        <div className="trow-body">
                          <div className="trow-top">
                            <b>{t.user.name}</b>
                            <span>{ago(t.at)}</span>
                          </div>
                          <p>{t.last ? `${t.last.mine ? 'You: ' : ''}${t.last.text}` : 'You are connected. Say hi.'}</p>
                        </div>
                        {t.unread > 0 && <i className="dot" aria-label={`${t.unread} unread`} />}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!data.requests.length && !data.threads.length && (
              <div className="inbox-empty">
                <p>No messages yet. Find someone open to a coffee chat and say hi.</p>
                <a className="btn btn-primary" href={href.people}>
                  Find people
                </a>
              </div>
            )}
            {data.sent.length > 0 && (
              <p className="fine sent-note">
                {data.sent.length} {data.sent.length === 1 ? 'request is' : 'requests are'} waiting for a reply.
              </p>
            )}
          </>
        )}
      </section>

      <section className="card inbox-thread">
        {id ? (
          <ThreadView key={id} uid={id} onSent={reload} />
        ) : (
          <div className="thread-none">
            <ChatsCircle weight="duotone" />
            <p>Pick a conversation.</p>
          </div>
        )}
      </section>
    </div>
  )
}
