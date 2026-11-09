import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DotsThree } from '@phosphor-icons/react/dist/csr/DotsThree'

export interface MenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

const GAP = 4
const EDGE = 8

// The list sits on top of the page, not inside the card, so a card that hides overflow cannot cut it.
export function Menu({ items, label = 'More' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  // Under the button, right edges lined up. Goes above when there is no room below. Stays inside the screen.
  useLayoutEffect(() => {
    if (!open) return setPos(null)
    function place() {
      const b = button.current?.getBoundingClientRect()
      const l = list.current
      if (!b || !l) return
      const w = l.offsetWidth
      const h = l.offsetHeight
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      const below = b.bottom + GAP
      const top = below + h > vh - EDGE && b.top - GAP - h > EDGE ? b.top - GAP - h : below
      const left = Math.min(Math.max(EDGE, b.right - w), vw - w - EDGE)
      setPos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !list.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu">
      <button ref={button} className="icon-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>
        <DotsThree weight="bold" />
      </button>
      {open &&
        createPortal(
          <div
            ref={list}
            className="menu-list"
            role="menu"
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
          >
            {items.map((it) => (
              <button
                key={it.label}
                role="menuitem"
                className={it.danger ? 'is-danger' : ''}
                onClick={() => {
                  setOpen(false)
                  it.onClick()
                }}
              >
                {it.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
