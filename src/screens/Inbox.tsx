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

type InboxData = { requests: Request[]; threads: Thread[] }
type ThreadData = { user: Person; status: Status; messages: Message[] }

// One line in the list. Requests and chats look the same; a reply accepts a request.
function Row({ person, at, text, unread, on }: { person: Person; at: number; text: string; unread: number; on: boolean }) {
  return (
    <li>
      <a href={href.inbox(person.uid)} className={`trow ${on ? 'is-on' : ''} ${unread ? 'is-unread' : ''}`}>
        <Avatar person={person} size={48} />
        <div className="trow-body">
          <div className="trow-top">
            <b>{person.name}</b>
            <span>{ago(at)}</span>
          </div>
          <p>{text}</p>
        </div>
        {unread > 0 && <i className="dot" aria-label={`${unread} unread`} />}
      </a>
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
      if (data.status === 'received') reload().then(refreshBadges)
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
  const first = user.name.split(' ')[0]
  const open = status === 'connected' || status === 'received'
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
            <span>{personLine(user)}</span>
          </div>
        </a>
      </header>

      <div className="thread-list" ref={list}>
        {!open ? (
          <div className="thread-empty">
            <Avatar person={user} size={72} />
            <p>{status === 'sent' ? `Waiting for ${first} to accept your request.` : `Connect with ${first} to start talking.`}</p>
            <ConnectButton person={user} status={status} onChange={(s) => (s === 'connected' ? reload() : setData({ ...data, status: s }))} size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="thread-empty">
            <Avatar person={user} size={72} />
            <p>{status === 'received' ? `${first} wants to connect. Say hi.` : 'You are connected. Say hi.'}</p>
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

      {open && (
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
                <ul className="threads">
                  {data.requests.map((r) => (
                    <Row key={r.user.uid} person={r.user} at={r.at} text={r.note || 'Wants to connect.'} unread={1} on={id === r.user.uid} />
                  ))}
                </ul>
              </>
            )}
            {data.threads.length > 0 && (
              <>
                {data.requests.length > 0 && <h2>Conversations</h2>}
                <ul className="threads">
                  {data.threads.map((t) => (
                    <Row
                      key={t.user.uid}
                      person={t.user}
                      at={t.at}
                      text={t.last ? `${t.last.mine ? 'You: ' : ''}${t.last.text}` : 'You are connected. Say hi.'}
                      unread={t.unread}
                      on={id === t.user.uid}
                    />
                  ))}
                </ul>
              </>
            )}
            {!data.requests.length && !data.threads.length && (
              <div className="inbox-empty">
                <p>No messages yet. Find someone and say hi.</p>
                <a className="btn btn-primary" href={href.people}>
                  Find people
                </a>
              </div>
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
