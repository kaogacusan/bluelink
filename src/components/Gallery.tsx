import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { CaretUp } from '@phosphor-icons/react/dist/csr/CaretUp'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { ImageSquare } from '@phosphor-icons/react/dist/csr/ImageSquare'
import { Star } from '@phosphor-icons/react/dist/csr/Star'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { Modal } from './Modal'
import { Sky } from './Network'
import { useApp } from '../lib/app'
import { fitJpeg } from '../lib/format'
import type { GalleryItem, PortfolioLook, PortfolioStyle } from '../types'

const MAX = 12
const HIGHLIGHTS = 2
const pad = (n: number) => String(n).padStart(2, '0')
const host = (link: string) => link.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
const PLAIN: PortfolioLook = { style: 'gallery', title: '' }

export interface WorkText {
  title: string
  caption: string
  link: string
}

export interface NewWork extends WorkText {
  data: string
}

// What you pick in Customize: the look, the order, and the highlights.
export interface Arrangement extends PortfolioLook {
  order: string[]
  featured: string[]
}

// What the owner of a portfolio can do. Leave it out and the portfolio is view only.
export interface GalleryEdit {
  add: (work: NewWork) => Promise<void>
  update: (id: string, work: WorkText) => Promise<void>
  remove: (id: string) => Promise<void>
  arrange: (a: Arrangement) => Promise<void>
}

const STYLES: { id: PortfolioStyle; name: string; note: string }[] = [
  { id: 'gallery', name: 'Gallery', note: 'Big pictures, then a grid' },
  { id: 'stage', name: 'Stage', note: 'Your work on a night sky' },
  { id: 'list', name: 'List', note: 'Titles first, like a studio site' },
]

// The shape of each picture, found when it loads. Very tall screenshots go in a phone.
type Shape = 'wide' | 'tall' | 'phone'
type See = (id: string, img: HTMLImageElement) => void

function useShapes(): [Record<string, Shape>, See] {
  const [shapes, setShapes] = useState<Record<string, Shape>>({})
  const see: See = (id, img) => {
    const r = img.naturalHeight / img.naturalWidth
    const shape: Shape = r > 1.6 ? 'phone' : r > 1.05 ? 'tall' : 'wide'
    setShapes((s) => (s[id] === shape ? s : { ...s, [id]: shape }))
  }
  return [shapes, see]
}

// Highlights go first: the ones you starred, or the first 2 if you starred none.
function split(items: GalleryItem[], order: string[] | null, featured: string[] | null) {
  const sorted = order
    ? [...order.map((id) => items.find((g) => g.id === id)).filter((g): g is GalleryItem => !!g), ...items.filter((g) => !order.includes(g.id))]
    : items
  const starred = sorted.filter((g) => (featured ? featured.includes(g.id) : g.featured))
  const top = (starred.length ? starred : sorted).slice(0, HIGHLIGHTS)
  return { top, rest: sorted.filter((g) => !top.includes(g)) }
}

interface LookProps {
  title: string
  top: GalleryItem[]
  rest: GalleryItem[]
  tools: ReactNode
  view: (g: GalleryItem) => void
  shapes: Record<string, Shape>
  see: See
  seed: string
}

// Work by a person, org, or business. The owner picks the style, the title, and up to 2 highlights.
export function Gallery({ items, look = PLAIN, edit, empty, seed }: { items: GalleryItem[]; look?: PortfolioLook; edit?: GalleryEdit; empty: string; seed: string }) {
  const { toast } = useApp()
  const [open, setOpen] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [draft, setDraft] = useState<Arrangement | null>(null)
  const [saving, setSaving] = useState(false)
  const [shapes, see] = useShapes()

  if (!items.length && !edit) return null

  // While you customize, the page shows your draft.
  const now = draft ?? look
  const title = now.title.trim() || 'Portfolio'
  const { top, rest } = split(items, draft?.order ?? null, draft?.featured ?? null)
  const shown = [...top, ...rest]

  function customize() {
    setDraft({ style: look.style, title: look.title, order: shown.map((g) => g.id), featured: items.filter((g) => g.featured).map((g) => g.id) })
  }

  async function save() {
    if (!edit || !draft) return
    setSaving(true)
    try {
      await edit.arrange(draft)
      setDraft(null)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const tools = edit && !draft && items.length > 0 && (
    <button className="icon-btn pf-edit" onClick={customize} aria-label="Edit portfolio">
      <PencilSimple weight="regular" />
    </button>
  )

  const props: LookProps = { title, top, rest, tools, view: (g) => setOpen(shown.indexOf(g)), shapes, see, seed }

  return (
    <>
      {draft && edit && <Tune draft={draft} setDraft={setDraft} items={shown} top={top} onEdit={setEditing} onAdd={() => setAdding(true)} onCancel={() => setDraft(null)} onSave={save} saving={saving} />}

      {!items.length ? (
        <section className="card section pf">
          <Head title={title} tools={null} />
          <p className="fine">{empty}</p>
          <div className="gallery">
            <button className="gallery-tile is-add" onClick={() => setAdding(true)}>
              <span className="gallery-frame">
                <Plus weight="bold" />
                <span>Add work</span>
              </span>
            </button>
          </div>
        </section>
      ) : now.style === 'stage' ? (
        <StageLook {...props} />
      ) : now.style === 'list' ? (
        <ListLook {...props} />
      ) : (
        <GalleryLook {...props} />
      )}

      {open !== null && shown[open] && <Viewer items={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} edit={edit} />}
      {adding && edit && <WorkForm heading="Add work" onClose={() => setAdding(false)} onSave={edit.add} />}
      {editing && edit && (
        <WorkForm
          heading="Edit work"
          work={editing}
          onClose={() => setEditing(null)}
          onSave={(w) => edit.update(editing.id, { title: w.title, caption: w.caption, link: w.link })}
          onRemove={() => edit.remove(editing.id)}
        />
      )}
    </>
  )
}

function Head({ title, tools }: { title: string; tools: ReactNode }) {
  return (
    <div className="pf-head">
      <h2>{title}</h2>
      {tools}
    </div>
  )
}

function OutLink({ link, className = 'pf-link' }: { link: string; className?: string }) {
  return (
    <a className={className} href={link} target="_blank" rel="noreferrer noopener">
      <span>{host(link)}</span> <ArrowUpRight weight="bold" />
    </a>
  )
}

// A picture in a plain frame. Phone screenshots sit in a phone body, so the whole screen shows.
function Pic({ g, shape, see, big }: { g: GalleryItem; shape?: Shape; see: See; big?: boolean }) {
  return (
    <span className={`gallery-frame is-${shape ?? 'wide'}${big ? ' is-big' : ''}`}>
      <img src={g.url} alt="" loading="lazy" onLoad={(e) => see(g.id, e.currentTarget)} />
    </span>
  )
}

// The rest of the work, one row each: picture, title, link.
function Rows({ items, view }: { items: GalleryItem[]; view: (g: GalleryItem) => void }) {
  return (
    <ol className="pf-rows">
      {items.map((g) => (
        <li key={g.id} className="pf-row">
          <button className="pf-row-main" onClick={() => view(g)} aria-label={`Open ${g.title}`}>
            <span className="pf-thumb">
              <img src={g.url} alt="" loading="lazy" />
            </span>
            <span className="pf-row-text">
              <b>{g.title}</b>
              {g.caption && <small>{g.caption}</small>}
            </span>
          </button>
          {g.link && <OutLink link={g.link} className="pf-row-link" />}
        </li>
      ))}
    </ol>
  )
}

// Gallery: highlights as big pictures, the rest in a grid.
function GalleryLook({ title, top, rest, tools, view, shapes, see }: LookProps) {
  return (
    <section className="card section pf is-gallery">
      <Head title={title} tools={tools} />
      <div className="pf-bigs">
        {top.map((g) => (
          <article key={g.id} className="pf-big">
            <button className="pf-big-pic" onClick={() => view(g)} aria-label={`Open ${g.title}`}>
              <Pic g={g} shape={shapes[g.id]} see={see} big />
            </button>
            <div className="pf-big-text">
              <b>{g.title}</b>
              {g.link && <OutLink link={g.link} />}
              {g.caption && <p>{g.caption}</p>}
            </div>
          </article>
        ))}
      </div>
      {rest.length > 0 && (
        <>
          <h3 className="pf-sub">More work</h3>
          <div className="gallery">
            {rest.map((g) => (
              <button key={g.id} className="gallery-tile" onClick={() => view(g)} aria-label={`Open ${g.title}`}>
                <Pic g={g} shape={shapes[g.id]} see={see} />
                <b>{g.title}</b>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// List: big titles. Highlights get a picture, the rest are rows.
function ListLook({ title, top, rest, tools, view, shapes, see }: LookProps) {
  return (
    <section className="card section pf is-list">
      <Head title={title} tools={tools} />
      <div className="pf-features">
        {top.map((g) => (
          <article key={g.id} className="pf-feature">
            <div className="pf-feature-text">
              <h3>
                <button onClick={() => view(g)}>{g.title}</button>
              </h3>
              {g.link && <OutLink link={g.link} />}
            </div>
            {g.caption && <p className="pf-feature-cap">{g.caption}</p>}
            <button className="pf-big-pic" onClick={() => view(g)} aria-label={`Open ${g.title}`}>
              <Pic g={g} shape={shapes[g.id]} see={see} big />
            </button>
          </article>
        ))}
      </div>
      {rest.length > 0 && <Rows items={rest} view={view} />}
    </section>
  )
}

// The devices lean a little toward your mouse. Off on touch screens and for reduced motion.
function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const set = (x: number, y: number) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--tx', x.toFixed(3))
        el.style.setProperty('--ty', y.toFixed(3))
      })
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5)
    }
    const leave = () => set(0, 0)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])
  return ref
}

// Stage: the highlights float as screens above a planet's horizon. The rest sit on the night side below.
function StageLook({ title, top, rest, tools, view, shapes, see, seed }: LookProps) {
  const scene = useTilt()
  const up = top.map((g) => shapes[g.id] === 'phone' || shapes[g.id] === 'tall')
  const ready = top.every((g) => shapes[g.id])
  const layout = top.length === 1 ? (up[0] ? 'solo-up' : 'solo') : up[0] === up[1] ? (up[0] ? 'two-up' : 'two-wide') : 'mixed'
  // In a mixed pair the wide screen stands behind and the tall one in front.
  const slot = (i: number) => (layout === 'mixed' ? (up[i] ? 'is-front' : 'is-back') : i === 0 ? 'is-back' : 'is-front')

  return (
    <section className="card pf is-stage">
      <Sky seed={seed} className="pf-sky" />
      <span className="pf-mark is-tl" aria-hidden />
      <span className="pf-mark is-tr" aria-hidden />
      <Head title={title} tools={tools} />
      <div ref={scene} className={`pf-scene is-${layout}${ready ? ' is-ready' : ''}`}>
        {top.map((g, i) => {
          const shape = shapes[g.id]
          const frame = shape === 'phone' ? 'phone' : shape === 'wide' && g.link ? 'browser' : 'plate'
          return (
            <button key={g.id} className={`pf-dev is-${frame} ${up[i] ? 'is-up' : 'is-flat'} ${slot(i)}`} onClick={() => view(g)} aria-label={`Open ${g.title}`}>
              <span className="pf-dev-body">
                {frame === 'browser' && (
                  <span className="pf-bar">
                    <span>{host(g.link)}</span>
                  </span>
                )}
                <span className="pf-screen">
                  <img src={g.url} alt="" onLoad={(e) => see(g.id, e.currentTarget)} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="pf-ground">
        <div className={`pf-captions is-${top.length}`}>
          {top.map((g) => (
            <div key={g.id} className="pf-cap">
              <button className="pf-cap-title" onClick={() => view(g)}>
                {g.title}
              </button>
              {g.caption && <p>{g.caption}</p>}
              {g.link && <OutLink link={g.link} />}
            </div>
          ))}
        </div>
        {rest.length > 0 && (
          <>
            <h3 className="pf-sub">More work</h3>
            <Rows items={rest} view={view} />
          </>
        )}
      </div>
      <span className="pf-mark is-bl" aria-hidden />
      <span className="pf-mark is-br" aria-hidden />
    </section>
  )
}

// Customize: pick a style, name the section, star up to 2 highlights, and set the order.
function Tune({
  draft,
  setDraft,
  items,
  top,
  onEdit,
  onAdd,
  onCancel,
  onSave,
  saving,
}: {
  draft: Arrangement
  setDraft: (a: Arrangement) => void
  items: GalleryItem[]
  top: GalleryItem[]
  onEdit: (g: GalleryItem) => void
  onAdd: () => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
}) {
  const set = (d: Partial<Arrangement>) => setDraft({ ...draft, ...d })
  const starred = (g: GalleryItem) => draft.featured.includes(g.id)

  // A third star takes the place of the oldest one. Starred work moves to the top.
  function star(g: GalleryItem) {
    const featured = starred(g) ? draft.featured.filter((x) => x !== g.id) : [...draft.featured, g.id].slice(-HIGHLIGHTS)
    const ids = items.map((x) => x.id)
    set({ featured, order: [...ids.filter((x) => featured.includes(x)), ...ids.filter((x) => !featured.includes(x))] })
  }

  // Work moves up and down inside its own group: the starred ones, or the rest.
  const canMove = (i: number, d: number) => !!items[i + d] && starred(items[i]) === starred(items[i + d])
  function move(i: number, d: number) {
    if (!canMove(i, d)) return
    const ids = items.map((x) => x.id)
    ;[ids[i], ids[i + d]] = [ids[i + d], ids[i]]
    set({ order: ids })
  }

  return (
    <section className="card section pf-tune">
      <div className="pf-tune-head">
        <h2>Customize</h2>
        <div className="pf-tools">
          <button className="btn btn-sm btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <label className="field">
        <span>Title</span>
        <input className="input" value={draft.title} maxLength={40} placeholder="Portfolio" onChange={(e) => set({ title: e.target.value })} />
      </label>

      <div className="field">
        <span>Style</span>
        <div className="pf-styles" role="radiogroup" aria-label="Style">
          {STYLES.map((s) => (
            <button key={s.id} role="radio" aria-checked={draft.style === s.id} className={draft.style === s.id ? 'pf-style is-on' : 'pf-style'} onClick={() => set({ style: s.id })}>
              <span className={`pf-mini is-${s.id}`} aria-hidden>
                <i />
                <i />
                <i />
                <i />
              </span>
              <b>{s.name}</b>
              <small>{s.note}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Highlights and order</span>
        <p className="fine">Star up to 2. They show big at the top.</p>
        <ol className="pf-tune-list">
          {items.map((g, i) => (
            <li key={g.id} className={top.includes(g) ? 'is-top' : ''}>
              <span className="pf-thumb">
                <img src={g.url} alt="" loading="lazy" />
              </span>
              <span className="pf-row-text">
                <b>{g.title}</b>
                <small>{top.includes(g) ? 'Highlight' : g.caption || host(g.link)}</small>
              </span>
              <span className="pf-tune-btns">
                <button className={starred(g) ? 'icon-btn is-star' : 'icon-btn'} onClick={() => star(g)} aria-pressed={starred(g)} aria-label={starred(g) ? 'Remove star' : 'Star as a highlight'}>
                  <Star weight={starred(g) ? 'fill' : 'regular'} />
                </button>
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={!canMove(i, -1)} aria-label="Move up">
                  <CaretUp weight="bold" />
                </button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={!canMove(i, 1)} aria-label="Move down">
                  <CaretDown weight="bold" />
                </button>
                <button className="icon-btn" onClick={() => onEdit(g)} aria-label={`Edit ${g.title}`}>
                  <PencilSimple weight="regular" />
                </button>
              </span>
            </li>
          ))}
        </ol>
        {items.length < MAX && (
          <button className="btn btn-sm btn-outline pf-tune-add" onClick={onAdd}>
            <Plus weight="bold" /> Add work
          </button>
        )}
      </div>
    </section>
  )
}

function Viewer({ items, index, onIndex, onClose, edit }: { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void; edit?: GalleryEdit }) {
  const { toast } = useApp()
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
    if (!edit) return
    try {
      await edit.remove(g.id)
      if (items.length > 1) onIndex(Math.min(index, items.length - 2))
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
          {edit &&
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

// Add a new piece of work, or change the words on one you added.
function WorkForm({ heading, work, onClose, onSave, onRemove }: { heading: string; work?: GalleryItem; onClose: () => void; onSave: (w: NewWork) => Promise<void>; onRemove?: () => Promise<void> }) {
  const { toast } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<string | null>(null)
  const [title, setTitle] = useState(work?.title ?? '')
  const [caption, setCaption] = useState(work?.caption ?? '')
  const [link, setLink] = useState(work?.link ?? '')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const pic = data ?? work?.url ?? null

  async function onFile(file?: File) {
    if (!file) return
    try {
      setData(await fitJpeg(file))
    } catch {
      toast('That picture did not work. Try another one.')
    }
  }

  async function run(job: () => Promise<void>) {
    setBusy(true)
    try {
      await job()
      onClose()
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const fullLink = link.trim() && !/^https?:\/\//i.test(link.trim()) ? `https://${link.trim()}` : link

  return (
    <Modal title={heading} onClose={onClose}>
      <button className={`gallery-drop ${pic ? 'has-pic' : ''}`} onClick={() => !work && input.current?.click()} type="button" disabled={!!work}>
        {pic ? (
          <img src={pic} alt="" />
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
        {onRemove &&
          (confirm ? (
            <button className="btn btn-danger pf-remove" onClick={() => run(onRemove)} disabled={busy}>
              Yes, remove
            </button>
          ) : (
            <button className="btn btn-ghost is-danger-text pf-remove" onClick={() => setConfirm(true)}>
              Remove
            </button>
          ))}
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={() => run(() => onSave({ data: data ?? '', title, caption, link: fullLink }))} disabled={(!work && !data) || !title.trim() || busy}>
          {busy ? 'Saving…' : work ? 'Save' : 'Add'}
        </button>
      </div>
    </Modal>
  )
}
