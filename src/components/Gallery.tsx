import { useEffect, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { ImageSquare } from '@phosphor-icons/react/dist/csr/ImageSquare'
import { Modal } from './Modal'
import { api } from '../lib/api'
import { useApp } from '../lib/app'
import { fitJpeg } from '../lib/format'
import type { FullPerson, GalleryItem } from '../types'

const MAX = 12
const pad = (n: number) => String(n).padStart(2, '0')
const host = (link: string) => link.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')

// A person's work, as a grid of pictures. Click one to see it big.
export function Gallery({ items, isMe }: { items: GalleryItem[]; isMe: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  if (!items.length && !isMe) return null

  return (
    <section className="card section">
      <div className="section-head">
        <h2>Portfolio</h2>
        {items.length > 0 && <span className="section-count">{pad(items.length)}</span>}
      </div>
      {!items.length && <p className="fine">Show what you have made. Add pictures of projects, designs, or events.</p>}
      <div className="gallery">
        {items.map((g, i) => (
          <button key={g.id} className="gallery-tile" onClick={() => setOpen(i)} aria-label={`Open ${g.title}`}>
            <span className="gallery-frame">
              <img src={g.url} alt="" loading="lazy" />
            </span>
            <b>{g.title}</b>
            {g.caption && <span className="gallery-caption">{g.caption}</span>}
          </button>
        ))}
        {isMe && items.length < MAX && (
          <button className="gallery-tile is-add" onClick={() => setAdding(true)}>
            <span className="gallery-frame">
              <Plus weight="bold" />
              <span>Add work</span>
            </span>
          </button>
        )}
      </div>
      {open !== null && items[open] && <Viewer items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} isMe={isMe} />}
      {adding && <AddWork onClose={() => setAdding(false)} />}
    </section>
  )
}

function Viewer({ items, index, onIndex, onClose, isMe }: { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void; isMe: boolean }) {
  const { setMe, toast } = useApp()
  const [confirm, setConfirm] = useState(false)
  const g = items[index]
  const many = items.length > 1
  const step = (d: number) => {
    setConfirm(false)
    onIndex((index + d + items.length) % items.length)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (many && e.key === 'ArrowRight') step(1)
      if (many && e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  })

  async function remove() {
    try {
      const r = await api<{ user: FullPerson }>(`/api/me/gallery/${g.id}/remove`, {})
      setMe(r.user)
      if (r.user.gallery.length) onIndex(Math.min(index, r.user.gallery.length - 1))
      else onClose()
      setConfirm(false)
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={g.title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <header className="viewer-top">
        <span className="viewer-count">
          {pad(index + 1)} / {pad(items.length)}
        </span>
        <button className="viewer-btn" onClick={onClose} aria-label="Close">
          <X weight="bold" />
        </button>
      </header>

      <div className="viewer-stage" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        {many && (
          <button className="viewer-btn is-side is-prev" onClick={() => step(-1)} aria-label="Previous">
            <CaretLeft weight="bold" />
          </button>
        )}
        <img key={g.id} src={g.url} alt={g.title} />
        {many && (
          <button className="viewer-btn is-side is-next" onClick={() => step(1)} aria-label="Next">
            <CaretRight weight="bold" />
          </button>
        )}
      </div>

      <footer className="viewer-info">
        <div>
          <b>{g.title}</b>
          {g.caption && <p>{g.caption}</p>}
        </div>
        <div className="viewer-actions">
          {g.link && (
            <a className="btn btn-sm btn-outline" href={g.link} target="_blank" rel="noreferrer noopener">
              {host(g.link)} <ArrowUpRight weight="bold" />
            </a>
          )}
          {isMe &&
            (confirm ? (
              <button className="btn btn-sm btn-danger" onClick={remove}>
                Yes, remove
              </button>
            ) : (
              <button className="btn btn-sm btn-ghost is-danger-text" onClick={() => setConfirm(true)}>
                Remove
              </button>
            ))}
        </div>
      </footer>
    </div>
  )
}

function AddWork({ onClose }: { onClose: () => void }) {
  const { setMe, toast } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFile(file?: File) {
    if (!file) return
    try {
      setData(await fitJpeg(file))
    } catch {
      toast('That picture did not work. Try another one.')
    }
  }

  async function save() {
    setBusy(true)
    try {
      const r = await api<{ user: FullPerson }>('/api/me/gallery', { data, title, caption, link: link.trim() && !/^https?:\/\//i.test(link.trim()) ? `https://${link.trim()}` : link })
      setMe(r.user)
      onClose()
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add work" onClose={onClose}>
      <button className={`gallery-drop ${data ? 'has-pic' : ''}`} onClick={() => input.current?.click()} type="button">
        {data ? (
          <img src={data} alt="" />
        ) : (
          <>
            <ImageSquare weight="regular" />
            <span>Pick a picture</span>
          </>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <label className="field">
        <span>Title</span>
        <input className="input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Org website, thesis poster, logo" />
      </label>
      <label className="field">
        <span>What is it?</span>
        <input className="input" value={caption} maxLength={160} onChange={(e) => setCaption(e.target.value)} placeholder="Optional" />
      </label>
      <label className="field">
        <span>Link</span>
        <input className="input" value={link} maxLength={200} inputMode="url" onChange={(e) => setLink(e.target.value)} placeholder="Optional" />
      </label>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save} disabled={!data || !title.trim() || busy}>
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </Modal>
  )
}
